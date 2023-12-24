
const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
  const authorizationHeader = req.headers['authorization'];

  // Handle unauthorized or invalid token scenarios
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    res.redirect('http://localhost:8081/login');
    res.status(401).json({ message: 'Unauthorized' });
  }

  // Handle invalid token scenario
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded;
    return next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.redirect('http://localhost:8081/login');
    res.status(403).json({ message: 'Invalid Token' });
  }

};
