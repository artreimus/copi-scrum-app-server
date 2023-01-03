const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');
const Board = require('../models/Board');
const { verifyNoteStatus } = require('../utils');
const validateDates = require('../utils/validateDates');

// @desc Get all notes
// @route GET /notes
// @access Private
const getAllNotes = asyncHandler(async (req, res) => {
  const { boardId } = req.query;

  const notes = await Note.find({ boardId })
    .populate({ path: 'users', select: 'username image' })
    .lean();

  res.status(StatusCodes.OK).json(notes);
});

// @desc Get note
// @route GET /boards/:id
// @access Public
const getSingleNote = asyncHandler(async (req, res) => {
  const { id: noteId } = req.params;
  const note = await Note.findById(noteId)
    .populate({ path: 'users', select: 'username image' })
    .lean();

  if (!note) {
    throw new CustomError.NotFoundError(`No note with id ${noteId} found`);
  }

  res.status(StatusCodes.OK).json({ note, message: `Note found` });
});

// @desc Create new note
// @route POST /notes
// @access Private
const createNote = asyncHandler(async (req, res) => {
  const { title, text, boardId, users } = req.body;
  const { userId } = req;

  if (!title || !text || !userId || !boardId) {
    throw new CustomError.BadRequestError('Please provide all fields');
  }

  const isBoardExist = await Board.findById(boardId).select('_id').exec();

  if (!isBoardExist) {
    throw new CustomError.NotFoundError(
      `Board with id ${boardId} does not exist`
    );
  }

  const duplicate = await Note.findOne({ title })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec();

  // title must be unique per board
  if (duplicate?.boardId === boardId) {
    throw new CustomError.ConflictError(`Note title ${title} already taken`);
  }

  const noteInfo = {
    title,
    text,
    noteCreator: userId,
    users,
    boardId,
  };

  const note = await Note.create(noteInfo);

  if (note) {
    res.status(StatusCodes.OK).json({ message: `${note.title} created` });
  } else {
    throw new CustomError.BadRequestError(
      'An error was encoutered while creating a new note'
    );
  }
});

// @desc Update a note
// @route PATCH /notes
// @access Private
const updateNote = asyncHandler(async (req, res) => {
  const { startDate, endDate, status } = req.body;
  const noteId = req.params.id;

  if (status) {
    if (startDate && endDate) {
      if (!validateDates(startDate, endDate)) {
        throw new CustomError.BadRequestError('Invalid dates');
      }
    }

    if (!verifyNoteStatus({ status, startDate, endDate })) {
      throw new CustomError.BadRequestError(
        `Note status should be in sync with start date and end date`
      );
    }
  }

  const note = await Note.findOneAndUpdate({ _id: noteId }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!note) {
    throw new CustomError.NotFoundError(`No note with id: ${noteId}`);
  }

  res.status(StatusCodes.OK).json({ message: `${note.title} updated`, note });
});

// @desc Update the assigned users in a note
// @route PATCH /notes/:id/updateNoteUsers
// @access Private
const updateNoteUsers = asyncHandler(async (req, res) => {
  const noteId = req.params.id;
  const { users } = req.body;

  const note = await Note.findById(noteId).exec();

  if (!note) {
    throw new CustomError.NotFoundError(`No note with id: ${noteId}`);
  }

  const allUsers = await User.find().select('_id');

  if (!allUsers.length) {
    throw new CustomError.NotFoundError('No users found');
  }

  const existingUsers = [];
  allUsers.forEach((user) => {
    if (users?.includes(user._id.toString())) existingUsers.push(user._id);
  });

  note.users = [...existingUsers];

  const updateNote = await note.save();

  res.status(StatusCodes.OK).json({
    message: `${updateNote.title} users updated`,
    note: updateNote,
  });
});

// @desc Delete a note
// @route DELETE /notes
// @access Private
const deleteNote = asyncHandler(async (req, res) => {
  const noteId = req.params.id;

  if (!noteId) {
    throw new CustomError.BadRequestError('Please provide note ID');
  }

  const note = await Note.findById(noteId).exec();

  if (!note) {
    throw new CustomError.NotFoundError(`No note with id: ${noteId}`);
  }

  const result = await note.deleteOne();

  res.status(StatusCodes.OK).json({ message: `Note ${result.title} deleted` });
});

module.exports = {
  getAllNotes,
  getSingleNote,
  createNote,
  updateNote,
  updateNoteUsers,
  deleteNote,
};
