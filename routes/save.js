const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

router.post('/save-club', verifyToken, async (req, res) => {
  try {
    const { clubId } = req.body;
    const user = req.user;

    if (user.saved.includes(clubId)) {
        return res.status(400).json({ error: 'Club ID already saved for this user' });
    }

    user.saved.push(clubId);
    await user.save();

    res.status(200).json({ message: 'Club ID saved successfully' });
  } catch (error) {
    console.error('Error saving club ID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET route to check if a club is saved
router.get('/check-club/:clubId', verifyToken, async (req, res) => {
  try {
    const { clubId } = req.params;
    const user = req.user;

    const isClubSaved = user.saved.includes(clubId);
    res.status(200).json({ isClubSaved });
  } catch (error) {
    console.error('Error checking if club is saved:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET route to get all clubs saved by a user
router.get('/get-saved-clubs', verifyToken, async (req, res) => {
  try {
    const user = req.user;

    const savedClubs = user.saved;
    res.status(200).json({ savedClubs });
  } catch (error) {
    console.error('Error getting saved clubs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
