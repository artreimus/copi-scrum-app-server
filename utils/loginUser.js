const CustomError = require('../errors');

const checkCookies = (req) => {
  const cookies = req.signedCookies;

  if (!cookies?.refreshToken) {
    throw new CustomError.BadRequestError('Invalid cookies');
  }

  return cookies;
};

module.exports = checkCookies;
