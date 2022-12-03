const jwt = require('jsonwebtoken');

const createJWT = (payload, key, expiration) => {
  const token = jwt.sign(payload, key, { expiresIn: expiration });
  return token;
};

const attachCookieToResponse = ({ res, user }) => {
  const refreshToken = createJWT(
    { user },
    process.env.REFRESH_TOKEN_SECRET,
    '7d'
  );

  const sevenDays = 1000 * 60 * 60 * 24 * 7;

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    expires: new Date(Date.now() + sevenDays),
    secure: true,
    sameSite: 'None', // cross-site cookie
    signed: true,
  });
};

module.exports = {
  createJWT,
  attachCookieToResponse,
};
