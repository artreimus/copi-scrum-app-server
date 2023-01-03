const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');
const {
  createTokenUser,
  createJWT,
  attachCookieToResponse,
} = require('../utils');
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
  const user = await User.findOne({ _id: req.params.id })
    .select('-password')
    .lean();

  if (!user) {
    throw new CustomError.NotFoundError('No users found');
  }

  res.status(StatusCodes.OK).json({ user });
});

// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
  const { username, email, oldPassword, newPassword, image } = req.body;
  const { userId } = req;

  const foundUser = await User.findById(userId).exec();

  if (!foundUser) {
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
    foundUser.email = email;
  }

  if (username) {
    const duplicate = await User.findOne({ username })
      .collation({ locale: 'en', strength: 2 })
      .lean()
      .exec();

    if (duplicate && duplicate?._id.toString() !== userId) {
      throw new CustomError.ConflictError(`Username ${username} already taken`);
    }
    foundUser.username = username;
  }

  if (newPassword && oldPassword) {
    const isPasswordCorrect = await foundUser.comparePassword(oldPassword);
    if (!isPasswordCorrect) {
      throw new CustomError.UnauthenticatedError('Invalid credentials');
    }
    foundUser.password = newPassword;
  }

  if (image) {
    foundUser.image = image;
  }

  const updatedUser = await foundUser.save();

  const user = createTokenUser(updatedUser);

  const accessToken = createJWT(
    { user },
    process.env.ACCESS_TOKEN_SECRET,
    '15m'
  );

  attachCookieToResponse({ res, user });

  console.log(updatedUser);

  res
    .status(StatusCodes.OK)
    .json({ message: `${updatedUser.username} updated`, accessToken });
});

module.exports = {
  getAllUsers,
  getSingleUser,
  updateUser,
};
