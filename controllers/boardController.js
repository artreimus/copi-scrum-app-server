const User = require('../models/User');
const Board = require('../models/Board');
const asyncHandler = require('express-async-handler');
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');
const { authorizeBoardUser, authorizeBoardAdmin } = require('../utils');

// @desc Get all boards
// @route GET /boards
// @access Public
const getAllBoards = asyncHandler(async (req, res) => {
  const boards = await Board.find()
    .populate({ path: 'admins users', select: 'username' })
    .lean()
    .select('-password');

  if (!boards?.length) {
    throw new CustomError.NotFoundError('No board found');
  }

  res.status(StatusCodes.OK).json(boards);
});

// @desc Get board
// @route GET /boards/:id
// @access Public
const getSingleBoard = asyncHandler(async (req, res) => {
  const { id: boardId } = req.params;
  const board = await Board.findById(boardId)
    .populate({ path: 'admins users', select: 'username' })
    .lean();

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
  const { title, description, startDate, endDate, password } = req.body;
  const { userId } = req;

  if (!title || !description || !userId || !startDate || !endDate) {
    throw new CustomError.BadRequestError('Please provide all fields');
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

  const boardInfo = {
    admins: [userId],
    title,
    description,
    startDate,
    endDate,
  };

  console.log('boardInfo', boardInfo);

  if (password) {
    boardInfo.password = password;
    boardInfo.private = true;
  }

  const board = await Board.create(boardInfo);

  return res
    .status(StatusCodes.CREATED)
    .json({ message: 'New board created', board });
});

// @desc Update a board
// @route PATCH /boards
// @access Private
const updateBoard = asyncHandler(async (req, res) => {
  const boardId = req.params.id;
  const { userId } = req;

  const board = await Board.findById(boardId);

  if (!board) {
    throw new CustomError.NotFoundError(`No board with id: ${boardId}`);
  }

  if (!authorizeBoardAdmin(board, userId)) {
    throw new CustomError.UnauthorizedError(`User is not an admin: ${userId}`);
  }

  const updatedBoard = await Board.findOneAndUpdate(
    { _id: boardId },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res
    .status(StatusCodes.OK)
    .json({ message: `${board.title} updated`, updatedBoard });
});

// @desc Update the admins in a board
// @route PATCH /boards/updateBoardAdmins
// @access Private
const updateBoardAdmins = asyncHandler(async (req, res) => {
  const boardId = req.params.id;
  const { admins } = req.body;
  const { userId } = req;

  const board = await Board.findById(boardId).exec();

  if (!board) {
    throw new CustomError.NotFoundError(`No board with id: ${boardId}`);
  }

  if (!authorizeBoardAdmin(board, userId)) {
    throw new CustomError.UnauthorizedError(`User is not an admin: ${userId}`);
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

  // downgrade from admin to user
  board.admins.forEach((admin) => {
    if (!admins.includes(admin.toString())) {
      board.users?.push(admin);
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
  const { userId } = req;

  const board = await Board.findById(boardId).exec();

  if (!board) {
    throw new CustomError.NotFoundError(`No board with id: ${boardId}`);
  }

  if (!authorizeBoardAdmin(board, userId)) {
    throw new CustomError.UnauthorizedError(`User is not an admin: ${userId}`);
  }

  const allUsers = await User.find().select('_id');

  if (!allUsers.length) {
    throw new CustomError.NotFoundError('No users found');
  }

  const existingUsers = [];
  allUsers.forEach((user) => {
    if (users?.includes(user._id.toString())) existingUsers.push(user._id);
  });

  board.users = [...existingUsers];

  const updatedBoard = await board.save();

  res.status(StatusCodes.OK).json({
    message: `${updatedBoard.title} users updated`,
    board: updatedBoard,
  });
});

// @desc Delete a board
// @route DELETE /boards
// @access Private
const deleteBoard = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const { userId } = req;

  if (!id) {
    throw new CustomError.BadRequestError('Please provider board ID');
  }

  const board = await Board.findById(id).exec();

  if (!board) {
    throw new CustomError.NotFoundError(`No board with id: ${id}`);
  }

  if (!authorizeBoardAdmin(board, userId)) {
    throw new CustomError.UnauthorizedError(`User is not an admin: ${userId}`);
  }

  const result = await board.deleteOne();

  if (result) {
    const reply = `Board '${result.title}' with ID ${result._id} deleted`;
    res.status(StatusCodes.OK).json({ message: reply });
  } else {
    throw new CustomError.BadRequestError('Error creating board');
  }
});

// @desc Access a board
// @route POST /boards/:id/accessBoard
// @access Private
const accessBoard = asyncHandler(async (req, res) => {
  const { password, userId } = req.body;
  const boardId = req.params.id;

  const board = await Board.findById(boardId).exec();

  if (!board) {
    throw new CustomError.NotFoundError(`No board with id: ${id}`);
  }

  if (authorizeBoardUser(board, userId)) {
    return res
      .status(StatusCodes.OK)
      .json({ message: 'User credentials valid' });
  }

  if (board.private) {
    if (!password) {
      throw new CustomError.UnauthenticatedError('Please provide credentials');
    }
    const isPasswordCorrect = await board.comparePassword(password);
    if (!isPasswordCorrect) {
      throw new CustomError.UnauthenticatedError('Invalid credentials');
    }
  }

  // add user to board's users if it passes all validations
  board.users.push(userId);

  const result = await board.save();

  if (result) {
    const reply = `User ${userId} added to board: ${result.title}`;
    res.status(StatusCodes.OK).json({ message: reply });
  } else {
    throw new CustomError.BadRequestError('Error accessing board');
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
  accessBoard,
};
