const checkAuthorization = require('./checkAuthorization');
const createTokenUser = require('./createTokenUser');
const { attachCookieToResponse, createJWT } = require('./jwt');
const checkCookies = require('./checkCookies');

module.exports = {
  checkAuthorization,
  createTokenUser,
  attachCookieToResponse,
  createJWT,
  checkCookies,
};
