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
  sendResetPasswordEmail,
  createHash,
} = require('../utils');
const crypto = require('crypto');

// @desc Register
// @route POST /auth/register
// @access Public
const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new CustomError.BadRequestError('Please provide all fields');
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
    throw new CustomError.ConflictError('Username or email already exist');
  }

  const verificationToken = crypto.randomBytes(40).toString('hex');

  const newUser = await User.create({
    username,
    email,
    password,
    verificationToken,
  });

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
// @route POST /auth/login
// @access Public
const login = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new CustomError.BadRequestError('Please provide all fields');
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
          .json({ message: 'Invalid token. Please login' });
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

// @desc Logout
// @route {POST} /auth/logout
// @access Public - just to clearn cookie if exists
const logout = asyncHandler(async (req, res) => {
  checkCookies(req);

  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'None',
    secure: true,
  });
  res.status(StatusCodes.OK).json({ message: 'Cookie successfully cleared' });
});

// @desc Forgot Password
// @route {POST} /auth/forgot-password
// @access Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new CustomError.BadRequestError('Please provide a valid email');
  }

  const user = await User.findOne({ email });

  if (user) {
    const passwordToken = crypto.randomBytes(70).toString('hex');

    const origin = 'http://localhost:5173';

    await sendResetPasswordEmail({
      name: user.username,
      email: user.email,
      token: passwordToken,
      origin,
    });

    const expirationDate = 1000 * 60 * 10; // 10 minutes
    const passwordTokenExpirationDate = new Date(Date.now() + expirationDate);
    user.passwordToken = createHash(passwordToken);
    user.passwordTokenExpirationDate = passwordTokenExpirationDate;
    await user.save();
  }

  res.status(StatusCodes.OK).json({
    message:
      'Please check your email for the reset password instructions. If you cannot find the email please check the spam folder',
  });
});

// @desc Reset Password
// @route {POST} /auth/reset-password
// @access Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token, email, password } = req.body;

  if (!token || !email || !password) {
    throw new CustomError.BadRequestError('Please provide all fields');
  }

  const user = await User.findOne({ email });

  if (user) {
    const currentDate = new Date();

    if (user.passwordTokenExpirationDate < currentDate) {
      throw new CustomError.BadRequestError(
        'Password request link has expired. Please try again'
      );
    }

    if (user.passwordToken === createHash(token)) {
      user.password = password;
      user.passwordToken = null;
      user.passwordTokenExpirationDate = null;
      await user.save();
    }
  }

  res.status(StatusCodes.OK).json({ message: 'Password reset successful' });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};
