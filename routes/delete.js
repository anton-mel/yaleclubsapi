const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const User = require('../models/user');

router.post('/delete-club', verifyToken, async (req, res) => {
  try {
    const { clubId } = req.body;
    const userId = req.userId;
    
    const user = await User.findOne({ userId });
    const ClubIndex = user.saved.indexOf(clubId);
    
    if (ClubIndex === -1) {
      return res.status(400).json({ error: 'Club ID not found in user\'s saved clubs' });
    }
    
    res.status(200).json({ ClubIndex });
    user.saved.splice(ClubIndex, 1);
    await user.save();

    res.status(200).json({ message: 'Club ID deleted successfully' });
  } catch (error) {
    console.error('Error deleting club ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;