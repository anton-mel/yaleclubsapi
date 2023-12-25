const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

router.delete('/delete-club', verifyToken, async (req, res) => {
  try {
    const { clubId } = req.body;
    const user = req.user;

    if (user.saved.includes(clubId)) {
      return res.status(400).json({ error: 'Club ID already saved for this user' });
    }

    const index = user.saved.indexOf(clubId);

    if (index === -1) {
        return res.status(400).json({ error: 'Club ID not found in user\'s saved clubs' });
    }

    user.saved.splice(index, 1);
    await user.save();

    res.status(200).json({ message: 'Club ID deleted successfully' });
  } catch (error) {
    console.error('Error deleting club ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;