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
  accessBoard,
  leaveBoard,
} = require('../controllers/boardController');
const verifyJWT = require('../middleware/verifyJWT');

router.get('/', getAllBoards);

router.use(verifyJWT);
router.post('/', createBoard);
router.post('/:id/accessBoard', accessBoard);
router.patch('/:id/updateBoardAdmins', updateBoardAdmins);
router.patch('/:id/updateBoardUsers', updateBoardUsers);
router.post('/:id/leaveBoard', leaveBoard);
router.route('/:id').patch(updateBoard).delete(deleteBoard).get(getSingleBoard);

module.exports = router;
