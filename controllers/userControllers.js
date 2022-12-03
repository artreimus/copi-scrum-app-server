const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').lean();
  if (!users?.length) {
    throw new CustomError.NotFoundError('No users found');
  }
  res.status(StatusCodes.OK).json(users);
});

// @desc Get single user
// @route GET /users/:id
// @access Private
const getSingleUser = asyncHandler(async (req, res) => {
  console.log('getting user.');
  const user = await User.findOne({ _id: req.params.id })
    .select('-password')
    .lean();

  if (!user) {
    throw new CustomError.NotFoundError('User not found');
  }

  console.log(req.user);
  // checkPermissions(req.user,user._id);

  res.status(StatusCodes.OK).json({ user });
});

// @desc Update a user
// @route PATCH /users/:id
// @access Private
const updateUser = asyncHandler(async (req, res) => {
  const { username, email, oldPassword, newPassword } = req.body;
  const userId = req.params.id;

  const user = await User.findById(userId).exec();

  if (!user) {
    throw new CustomError.NotFoundError(`No user with id: ${userId}`);
  }

  if (email) {
    const duplicate = await User.findOne({ email })
      .collation({ locale: 'en', strength: 2 })
      .lean()
      .exec();

    if (duplicate && duplicate?._id.toString() !== userId) {
      throw new CustomError.ConflictError(`Email ${email} already taken`);
    }
    user.email = email;
  }

  if (username) {
    const duplicate = await User.findOne({ username })
      .collation({ locale: 'en', strength: 2 })
      .lean()
      .exec();

    if (duplicate && duplicate?._id.toString() !== userId) {
      throw new CustomError.ConflictError(`Username ${username} already taken`);
    }
    user.username = username;
  }

  if (newPassword && oldPassword) {
    const isPasswordCorrect = await user.comparePassword(oldPassword);
    if (!isPasswordCorrect) {
      throw new CustomError.UnauthenticatedError('Invalid credentials');
    }
    user.password = newPassword;
  }

  const updatedUser = await user.save();

  res
    .status(StatusCodes.OK)
    .json({ message: `${updatedUser.username} updated` });
});

module.exports = {
  getAllUsers,
  getSingleUser,
  updateUser,
};
