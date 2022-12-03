const { StatusCodes } = require('http-status-codes');
const path = require('path');

const notFoundMiddleware = (req, res) => {
  // We can setup the status before sending the response
  res.status(StatusCodes.NOT_FOUND);
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, '..', 'views', '404.html'));
  } else if (req.accepts('json')) {
    res.json({ message: '404 Not Found' });
  } else {
    res.type('txt').send('404 not found');
  }
};

module.exports = notFoundMiddleware;
