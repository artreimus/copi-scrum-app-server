const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');

// @desc Get all notes
// @route GET /notes
// @access Private
const getAllNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find().lean();

  if (!notes?.length) {
    throw new CustomError.NotFoundError('No notes found');
  }

  res.status(StatusCodes.OK).json(notes);
});

// @desc Create new note
// @route POST /notes
// @access Private
const createNote = asyncHandler(async (req, res) => {
  const { usersId, title, text, startDate, noteCreator } = req.body;

  // Confirm data
  if (!title || !text || !noteCreator) {
    throw new CustomError.BadRequestError('Please provide all fields');
  }

  let users = [];

  if (usersId?.length) {
    const existingUsers = await User.find({ _id: { $in: usersId } })
      .lean()
      .exec();

    if (!existingUsers?.length) {
      throw new CustomError.NotFoundError(`Users ${usersId} does not exist`);
    }

    users = existingUsers.map((user) => user._id);
  }

  const duplicate = await Note.findOne({ title })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    throw new CustomError.ConflictError(`Note title ${title} already taken`);
  }

  const isCreatorExist = await User.findById(noteCreator).lean().exec();

  if (!isCreatorExist) {
    throw new CustomError.NotFoundError(`User ${noteCreator} does not exist`);
  }

  const noteInfo = users?.length
    ? { users, title, text, noteCreator }
    : { title, text, noteCreator };

  if (startDate) {
    noteInfo.startDate = startDate;
  }

  const note = await Note.create(noteInfo);

  if (note) {
    return res
      .status(StatusCodes.CREATED)
      .json({ message: 'New note created' });
  } else {
    throw new CustomError.BadRequestError('Please provide all fields');
  }
});

// @desc Update a note
// @route PATCH /notes
// @access Private
const updateNote = asyncHandler(async (req, res) => {
  const { usersId, title, text, startDate, endDate, status } = req.body;
  const noteId = req.params.id;

  let users = [];

  if (usersId?.length) {
    const existingUsers = await User.find({ _id: { $in: usersId } })
      .lean()
      .exec();

    if (!existingUsers?.length) {
      throw new CustomError.NotFoundError(`Users ${usersId} does not exist`);
    }

    users = existingUsers.map((user) => user._id);
  }

  const note = await Note.findById(noteId).exec();

  if (!note) {
    throw new CustomError.NotFoundError(`No note with id: ${noteId}`);
  }

  const duplicate = await Note.findOne({ title })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec();

  if (duplicate && duplicate?._id.toString() !== noteId) {
    throw new CustomError.ConflictError(`Note title ${title} already taken`);
  }

  note.users = [...users];
  if (title) note.title = title;
  if (text) note.text = text;
  if (startDate) note.startDate = startDate;
  if (endDate) note.endDate = endDate;
  if (status) note.status = status;

  const updatedNote = await note.save();

  res.status(StatusCodes.OK).json({ message: `${updatedNote.title} updated` });
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

  const reply = `Note '${result.title}' with ID ${result._id} deleted`;

  res.status(StatusCodes.OK).json({ message: reply });
});

module.exports = { getAllNotes, createNote, updateNote, deleteNote };
