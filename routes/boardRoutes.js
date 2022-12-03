const express = require('express');
const router = express.Router();
const {
  createBoard,
  getAllBoards,
  updateBoard,
  updateBoardAdmins,
  updateBoardUsers,
  deleteBoard,
  getSingleBoard,
} = require('../controllers/boardController');
const verifyJWT = require('../middleware/verifyJWT');

router.get('/', getAllBoards);
router.patch('/:id/updateBoardAdmins', updateBoardAdmins);
router.patch('/:id/updateBoardUsers', updateBoardUsers);

// router.use(verifyJWT);

router.post('/', createBoard);
router.route('/').get(getAllBoards).post(createBoard);
router.route('/:id').patch(updateBoard).delete(deleteBoard).get(getSingleBoard);

module.exports = router;
