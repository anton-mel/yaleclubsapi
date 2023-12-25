
const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
  const authorizationHeader = req.headers['authorization'];

  // Handle unauthorized or invalid token scenarios
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    res.redirect('http://localhost:8081/login');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authorizationHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded.userId);
    req.userId = decoded.userId; 
    return next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.redirect('http://localhost:8081/login');
    return res.status(403).json({ message: 'Invalid Token' });
  }
};
