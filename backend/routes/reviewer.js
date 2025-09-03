const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const { auth, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(auth);

// GET /api/reviewer/pending
router.get('/pending', authorize('Reviewer'), async (req, res) => {
  try {
    const submissions = await Request.find({ 
      'workflow.reviewer.status': 'Pending' 
    })
    .populate('developer', 'name email department')
    .sort({ createdAt: -1 });

    // Transform data to match frontend expectations
    const transformedSubmissions = submissions.map(submission => ({
      id: submission._id,
      appName: submission.appName,
      developerName: submission.developerName,
      submissionDate: submission.createdAt,
      checklistStatus: submission.checklistStatus,
      checklistItems: submission.checklist
    }));

    res.json(transformedSubmissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
});

// POST /api/reviewer/action
router.post('/action', authorize('Reviewer'), async (req, res) => {
  try {
    const { submissionId, action, remarks } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const request = await Request.findById(submissionId);
    if (!request) return res.status(404).json({ message: 'Submission not found' });

    if (request.workflow.reviewer.status !== 'Pending') {
      return res.status(400).json({ message: 'Submission already reviewed' });
    }

    // Update workflow
    request.workflow.reviewer.status = action === 'approve' ? 'Approved' : 'Rejected';
    request.workflow.reviewer.comment = remarks;
    request.workflow.reviewer.reviewedBy = req.user.userId;
    request.workflow.reviewer.reviewedAt = new Date();

    // Update overall status
    if (action === 'approve') {
      request.status = 'Under Review';
    } else {
      request.status = 'Rejected';
    }

    await request.save();

    res.json({ message: `Submission ${action}d successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update submission' });
  }
});

module.exports = router;