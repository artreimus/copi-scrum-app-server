const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: 'Invalid token', isError: true });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err)
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: 'Invalid token', isError: true });
    req.userId = decoded.user.userId;
    req.username = decoded.user.username;
    next();
  });
};

module.exports = verifyJWT;
