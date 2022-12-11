const User = require('../models/User');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');
const {
  createTokenUser,
  attachCookieToResponse,
  createJWT,
  checkCookies,
} = require('../utils');
const crypto = require('crypto');

// @desc Login
// @route POST /auth
// @access Public
const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new CustomError.BadRequestError('Plea se provide username and email');
  }

  const usernameAlreadyExist = await User.findOne({ username })
    .collation({ locale: 'en', strength: 2 })
    .select('_id')
    .exec();

  const emailAlreadyExist = await User.findOne({ email })
    .collation({ locale: 'en', strength: 2 })
    .select('_id')
    .exec();

  if (usernameAlreadyExist || emailAlreadyExist) {
    throw new CustomError.ConflictError(
      `Credentials ${username} or ${email} already taken`
    );
  }

  const verificationToken = crypto.randomBytes(40).toString('hex');

  const newUser = await User.create({
    username,
    email,
    password,
    verificationToken,
  });

  const origin = 'http://localhost:5137';

  const user = createTokenUser(newUser);

  const accessToken = createJWT(
    { user },
    process.env.ACCESS_TOKEN_SECRET,
    '15m'
  );

  attachCookieToResponse({ res, user });
  res
    .status(StatusCodes.OK)
    .json({ message: 'Registration successful', accessToken });
});

// @desc Login
// @route POST /auth
// @access Public
const login = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new CustomError.BadRequestError('Please provide username or email');
  }

  let foundUser;
  if (username) foundUser = await User.findOne({ username }).exec();
  if (email) foundUser = await User.findOne({ email }).exec();

  if (!foundUser) {
    throw new CustomError.UnauthorizedError('Invalid credentials');
  }

  const isPasswordCorrect = await foundUser.comparePassword(password);

  if (!isPasswordCorrect)
    throw new CustomError.UnauthorizedError('Invalid credentials');

  const user = createTokenUser(foundUser);

  const accessToken = createJWT(
    { user },
    process.env.ACCESS_TOKEN_SECRET,
    '15m'
  );

  attachCookieToResponse({ res, user });
  res.status(StatusCodes.OK).json({ message: 'Login successful', accessToken });
});

// @desc Refresh Token
// @route GET /auth/refresh
// @access Public - because token has expired
const refresh = asyncHandler(async (req, res) => {
  const cookies = checkCookies(req);

  const refreshToken = cookies.refreshToken;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    asyncHandler(async (err, decoded) => {
      if (err)
        return res
          .status(StatusCodes.FORBIDDEN)
          .json({ message: 'Invalid token' });

      const foundUser = await User.findOne({
        username: decoded.user.username,
      }).exec();

      if (!foundUser) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: 'Invalid token. User not found' });
      }

      const user = createTokenUser(foundUser);
      const accessToken = createJWT(
        { user },
        process.env.ACCESS_TOKEN_SECRET,
        '15m'
      );

      res.status(StatusCodes.OK).json({ accessToken });
    })
  );
});

// @desc Refresh Token
// @route {POST} /auth/logout
// @access Public - just to clearn cookie if exists
const logout = asyncHandler(async (req, res) => {
  checkCookies(req);

  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'None',
    secure: true,
  });
  res.status(StatusCodes.OK).json({ message: 'Cookie successfully Cleared' });
});

module.exports = { register, login, refresh, logout };
