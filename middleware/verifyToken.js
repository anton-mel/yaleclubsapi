
const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
  const authorizationHeader = req.headers['authorization'];

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authorizationHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    return next();
  } catch (error) {
    console.error('Error verifying token:', error);

    // Redirect to login page on localhost:8081
    if (req.headers.host === 'localhost:8081') {
      return res.redirect('http://localhost:8081/login');
    }

    return res.status(403).json({ message: 'Invalid Token' });
  }
}