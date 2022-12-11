const authorizeBoardAdmin = (board, userId) => {
  let isAuthorized = false;

  if (board.admins.includes(userId)) {
    isAuthorized = true;
  }

  console.log('userId', userId);
  console.log('admins', board.admins);
  console.log('isAuthorized', isAuthorized);

  return isAuthorized;
};

module.exports = authorizeBoardAdmin;
