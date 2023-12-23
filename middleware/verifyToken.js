
// Middleware to verify JWT token
module.exports = verifyToken = (req, res, next) => {
    const token = req.cookies.token;
  
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
  
    try {
        const decoded = jwt.verify(token, 'yaleclubs');
        req.session.user = decoded.userId;
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ message: 'Unauthorized' });
    }
};