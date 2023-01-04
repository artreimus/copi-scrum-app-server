const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  updateUser,
  getSingleUser,
} = require('../controllers/userControllers');
const { uploadUserImage } = require('../controllers/uploadsController');

const verifyJWT = require('../middleware/verifyJWT');

router.route('/').get(getAllUsers);
router.use(verifyJWT);
router.route('/').patch(updateUser);
router.route('/uploads').post(uploadUserImage);
router.route('/:id').get(getSingleUser);

module.exports = router;
