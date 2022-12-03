const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refresh,
  logout,
} = require('../controllers/authController');
const loginLimiterMiddleware = require('../middleware/loginLimiter');

router.post('/register', register);
router.post('/login', loginLimiterMiddleware, login);
router.get('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;
