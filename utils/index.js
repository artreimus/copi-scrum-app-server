const checkAuthorization = require('./checkAuthorization');
const createTokenUser = require('./createTokenUser');
const { attachCookieToResponse, createJWT } = require('./jwt');
const checkCookies = require('./checkCookies');
const authorizeBoardAdmin = require('./authorizeBoardAdmin');
const authorizeBoardUser = require('./authorizeBoardUser');
const verifyNoteStatus = require('./verifyNoteStatus');
const sendResetPasswordEmail = require('./sendResetPasswordEmail');
const createHash = require('./createHash');

module.exports = {
  checkAuthorization,
  createTokenUser,
  attachCookieToResponse,
  createJWT,
  createHash,
  checkCookies,
  authorizeBoardAdmin,
  authorizeBoardUser,
  verifyNoteStatus,
  sendResetPasswordEmail,
};
