const authorizeBoardAdmin = (board, userId) => {
  let isAuthorized = false;

  if (board.admins.includes(userId)) {
    isAuthorized = true;
  }

  return isAuthorized;
};

module.exports = authorizeBoardAdmin;
