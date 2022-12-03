const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const BoardSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    admins: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      required: [true, 'Please provide board admin'],
    },
    title: {
      type: String,
      required: [true, 'Please provide board title'],
    },
    description: {
      type: String,
      required: [true, 'Please provide board description'],
    },
    completed: {
      type: Boolean,
      default: false,
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

BoardSchema.plugin(AutoIncrement, {
  inc_field: 'board',
  id: 'boardNumbers',
  start_seq: 1,
});

module.exports = mongoose.model('Board', BoardSchema);
