const { checkAuthorization } = require('../utils');

const verifyRole = (req, res, next) => {
  checkAuthorization(req.roles);
  next();
};

module.exports = verifyRole;
