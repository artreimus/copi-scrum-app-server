const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('express-async-handler');
const path = require('path');
const CustomError = require('../errors');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// @desc Upload the user's profile picture in local storage
// @route
// @access
const uploadUserImageLocal = asyncHandler(async (req, res) => {
  if (!req.files) {
    throw new CustomError.BadRequestError('No file uploaded');
  }

  const userImage = req.files.image;

  if (!userImage.mimetype.startsWith('image')) {
    throw new CustomError.BadRequestError('Pleaase upload an image');
  }

  if (userImage.size > process.env.FILE_MAX_SIZE) {
    throw new CustomError.BadRequestError(
      `Please upload image smaller than ${process.env.FILE_MAX_SIZE / 1024}KB`
    );
  }

  const imagePath = path.join(__dirname, `../public/uploads/${userImage.name}`);

  await userImage.mv(imagePath);
  res
    .status(StatusCodes.OK)
    .json({ image: { src: `/uploads/${userImage.name}` } });
});

// @desc Upload the user's profile picture in cloudinary
// @route POST /users/uploads
// @access Private
const uploadUserImage = asyncHandler(async (req, res) => {
  const { userId } = req;

  if (!req.files) {
    throw new CustomError.BadRequestError('No file uploaded');
  }

  const userImage = req.files.image;

  if (!userImage.mimetype.startsWith('image')) {
    throw new CustomError.BadRequestError('Pleaase upload an image');
  }

  if (userImage.size > process.env.FILE_MAX_SIZE) {
    throw new CustomError.BadRequestError(
      `Please upload image smaller than ${process.env.FILE_MAX_SIZE / 1024}KB`
    );
  }
  const result = await cloudinary.uploader.upload(userImage.tempFilePath, {
    use_filename: false,
    public_id: `${userId}`,
    folder: 'copi-user-picture',
  });
  fs.unlinkSync(userImage.tempFilePath);

  return res.status(StatusCodes.OK).json({ image: { src: result.secure_url } });
});

module.exports = { uploadUserImage };
