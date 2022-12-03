const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    noteCreator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide note creator'],
    },
    title: {
      type: String,
      required: [true, 'Please provide note title'],
    },
    text: {
      type: String,
      required: [true, 'Please provide note text'],
    },
    status: {
      type: String,
      default: 'To do',
      enum: ['To do', 'In Progress', 'Finished'],
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', NoteSchema);
