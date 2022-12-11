const authorizeBoardUser = (board, userId) => {
  let isAuthorized = false;

  if (board.users.includes(userId) || board.admins.includes(userId)) {
    isAuthorized = true;
  }

  return isAuthorized;
};

module.exports = authorizeBoardUser;
