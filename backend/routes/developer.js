const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');

// POST /api/developer/submit
router.post('/submit', async (req, res) => {
  try {
    const { appName, checklist, internetFacing, developerName } = req.body;

    if (!appName || !internetFacing || !checklist) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const submission = await Submission.create({
      appName,
      developerName,
      submissionDate: new Date(),
      checklist,
      checklistStatus: Object.values(checklist).every(Boolean)
        ? 'complete'
        : Object.values(checklist).some(Boolean)
        ? 'partial'
        : 'incomplete',
      internetFacing,
      status: 'pending',
    });

    res.status(201).json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
