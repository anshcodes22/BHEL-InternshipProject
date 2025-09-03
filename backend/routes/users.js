const User = require('../models/User');
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Get all users (admin only, no password)
router.get('/', auth, async (req, res) => {
  try {
    // Only allow admin
    if (!req.user || (req.user.role !== 'Admin' && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user by id (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'Admin' && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
