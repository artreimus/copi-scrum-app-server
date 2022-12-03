const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please provide username'],
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      validate: {
        validator: validator.isEmail,
        message: 'Please provide valid email',
      },
    },
    password: {
      type: String,
      required: [true, 'Please provide user password'],
      minlength: 6,
    },
    verificationToken: String,
    isVerified: { type: Boolean, default: false },
    verified: Date,
    passwordToken: String,
    passwordTokenExpirationDate: { type: Date },
  },
  { toJSON: { virtuals: { virtuals: true } }, toObject: { virtual: true } }
);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

module.exports = mongoose.model('User', UserSchema);
