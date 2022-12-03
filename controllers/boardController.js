const User = require('../models/User');
const Board = require('../models/Board');
const asyncHandler = require('express-async-handler');
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');

// @desc Get all boards
// @route GET /boards
// @access Private
const getAllBoards = asyncHandler(async (req, res) => {
  const boards = await Board.find().lean();

  if (!boards?.length) {
    throw new CustomError.NotFoundError('No board found');
  }

  res.status(StatusCodes.OK).json(boards);
});

// @desc Get board
// @route GET /boards/:id
// @access Private
const getSingleBoard = asyncHandler(async (req, res) => {
  const { id: boardId } = req.params;
  const board = await Board.findById(boardId).lean();

  if (!board) {
    throw new CustomError.NotFoundError(`No board with id ${boardId}found`);
  }

  res
    .status(StatusCodes.OK)
    .json({ board, message: 'Board successfully found' });
});

// @desc Create new board
// @route POST /boards
// @access Private
const createBoard = asyncHandler(async (req, res) => {
  const { title, description, startDate } = req.body;
  const userId = req.userId;

  if (!title || !description) {
    throw new CustomError.BadRequestError(
      'Please provide title and description'
    );
  }

  const duplicate = await Board.findOne({ title })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    throw new CustomError.ConflictError(
      `Board with title ${title} already exist`
    );
  }

  const boardInfo = startDate
    ? {
        admins: [userId],
        title,
        description,
        startDate,
      }
    : {
        admins: [userId],
        title,
        description,
      };

  const board = await Board.create(boardInfo);

  if (board) {
    return res
      .status(StatusCodes.CREATED)
      .json({ message: 'New board created' });
  } else {
    throw new CustomError.BadRequestError('Error creating board');
  }
});

// @desc Update a board
// @route PATCH /boards
// @access Private
const updateBoard = asyncHandler(async (req, res) => {
  const boardId = req.params.id;
  const { title, description, completed, startDate, endDate } = req.body;

  // const board = await Board.findById(boardId).exec();
  const board = await Board.findOneAndUpdate({ _id: boardId }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!board) {
    throw new CustomError.NotFoundError(`No board with id: ${boardId}`);
  }

  res.status(StatusCodes.OK).json({ message: `${board.title} updated`, board });
});

// @desc Update the admins in a board
// @route PATCH /boards/updateBoardAdmins
// @access Private
const updateBoardAdmins = asyncHandler(async (req, res) => {
  const boardId = req.params.id;
  const { users: admins } = req.body;

  const board = await Board.findById(boardId).exec();

  if (!board) {
    throw new CustomError.NotFoundError(`No board with id: ${boardId}`);
  }

  const allUsers = await User.find().select('_id');

  if (!allUsers.length) {
    throw new CustomError.NotFoundError('No users found');
  }

  const existingAdmins = [];
  allUsers.forEach((user) => {
    if (admins?.includes(user._id.toString())) existingAdmins.push(user._id);
  });

  if (!existingAdmins.length) {
    throw new CustomError.NotFoundError('Admins not found');
  }

  // upgrade from user to admin
  existingAdmins.forEach((admin) => {
    if (board.users?.includes(admin)) {
      board.users?.pull(admin);
    }
  });

  board.admins = [...existingAdmins];

  const updatedBoard = await board.save();

  res.status(StatusCodes.OK).json({
    message: `${updatedBoard.title} admins updated`,
    board: updatedBoard,
  });
});

// @desc Update the users in a board
// @route PATCH /boards/updateBoardUsers
// @access Private
const updateBoardUsers = asyncHandler(async (req, res) => {
  const boardId = req.params.id;
  const { users } = req.body;

  const board = await Board.findById(boardId).exec();

  if (!board) {
    throw new CustomError.NotFoundError(`No board with id: ${boardId}`);
  }

  const allUsers = await User.find().select('_id');

  if (!allUsers.length) {
    throw new CustomError.NotFoundError('No users found');
  }

  const existingUsers = [];
  allUsers.forEach((user) => {
    if (users?.includes(user._id.toString())) existingUsers.push(user._id);
  });

  if (!existingUsers.length) {
    throw new CustomError.NotFoundError('Users not found');
  }

  // downgrade from  admin to user
  existingUsers.forEach((user) => {
    if (board.admins?.includes(user)) {
      board.admins?.pull(user);
    }
  });

  board.users = [...existingUsers];

  const updatedBoard = await board.save();

  res.status(StatusCodes.OK).json({
    message: `${updatedBoard.title} admins updated`,
    board: updatedBoard,
  });
});

// @desc Delete a board
// @route DELETE /boards
// @access Private
const deleteBoard = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!id) {
    throw new CustomError.BadRequestError('Please provider board ID');
  }

  const board = await Board.findById(id).exec();

  if (!board) {
    throw new CustomError.NotFoundError(`No board with id: ${id}`);
  }

  const result = await board.deleteOne();

  if (result) {
    const reply = `Board '${result.title}' with ID ${result._id} deleted`;
    res.status(StatusCodes.OK).json({ message: reply });
  } else {
    throw new CustomError.BadRequestError('Error creating board');
  }
});

module.exports = {
  getAllBoards,
  getSingleBoard,
  createBoard,
  updateBoard,
  updateBoardAdmins,
  updateBoardUsers,
  deleteBoard,
};
