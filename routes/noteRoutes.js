const express = require('express');
const router = express.Router();
const {
  getAllNotes,
  getSingleNote,
  createNote,
  updateNote,
  updateNoteUsers,
  deleteNote,
} = require('../controllers/noteControllers');

const verifyJWT = require('../middleware/verifyJWT');

router.use(verifyJWT);

router.route('/').get(getAllNotes).post(createNote);
router.patch('/:id/updateNoteUsers', updateNoteUsers);
router.route('/:id').get(getSingleNote).patch(updateNote).delete(deleteNote);

module.exports = router;
