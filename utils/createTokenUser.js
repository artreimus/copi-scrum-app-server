const createTokenUser = (user) => {
  return { username: user.username, userId: user._id, email: user.email };
};

module.exports = createTokenUser;
