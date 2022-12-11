const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  updateUser,
  getSingleUser,
} = require('../controllers/userControllers');
const verifyJWT = require('../middleware/verifyJWT');
// router.use(verifyJWT);

router.get('/', getAllUsers);
// router.use(verifyRole);
router.route('/:id').get(getSingleUser).patch(updateUser);

module.exports = router;
