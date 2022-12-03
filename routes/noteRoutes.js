const express = require('express');
const router = express.Router();
const {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
} = require('../controllers/noteControllers');

const verifyJWT = require('../middleware/verifyJWT');

// router.use(verifyJWT);

router.route('/').get(getAllNotes).post(createNote);

router.route('/:id').get().patch(updateNote).delete(deleteNote);

module.exports = router;
