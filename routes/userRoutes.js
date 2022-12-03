const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  updateUser,
  getSingleUser,
} = require('../controllers/userControllers');
const verifyJWT = require('../middleware/verifyJWT');
const verifyRole = require('../middleware/verifyRole');
// router.use(verifyJWT);

router.get('/', getAllUsers);
// router.use(verifyRole);
router.route('/:id').get(getSingleUser).patch(updateUser);

module.exports = router;
