const CustomError = require('../errors');

const checkAuthorization = (roles) => {
  if (roles.includes('Admin') || roles.includes('Manager')) return;

  throw new CustomError.UnauthorizedError(
    'Not authorized to access this route'
  );
};

module.exports = checkAuthorization;
