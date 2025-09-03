

const express = require('express');
const router = express.Router();
const { 
  createRequest, 
  getRequests, 
  getRequest, 
  approveRequest, 
  rejectRequest, 
  hostApplication 
} = require('../controllers/requestController');
const { getAuditTrail, getGlobalStatus } = require('../controllers/adminController');
// Admin endpoints for audit trail and global status
router.get('/audit', getAuditTrail);
router.get('/global-status', getGlobalStatus);
const { auth, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Clear audit history for all requests for the current user (or all if admin)
router.patch('/clear-history', async (req, res) => {
  try {
    const Request = require('../models/Request');
    const user = req.user;
    let filter = {};
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (user.role !== 'Admin' && user.role !== 'admin') {
      // Only clear for own requests if not admin
      filter = { developer: user.userId };
    }
    await Request.updateMany(filter, { $set: { auditHistory: [] } });
    res.json({ message: 'Audit history cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// All routes require authentication
router.use(auth);

// Create request (Developer only)
router.post('/', authorize('Developer'), upload.single('warFile'), createRequest);

// Get requests (filtered by role)
router.get('/', getRequests);

// Get single request
router.get('/:id', getRequest);

// Approve request (Reviewer, HOD, DTG, CDT, HostingTeam)
router.patch('/:id/approve', authorize('Reviewer', 'HOD', 'DTG', 'CDT', 'HostingTeam'), approveRequest);

// Reject request (Reviewer, HOD, DTG, CDT)
router.patch('/:id/reject', authorize('Reviewer', 'HOD', 'DTG', 'CDT'), rejectRequest);

// Host application (HostingTeam only)
router.patch('/:id/host', authorize('HostingTeam'), hostApplication);
// Hosting team rejects deployment
const { rejectHostApplication } = require('../controllers/requestController');
router.patch('/:id/host-reject', authorize('HostingTeam'), rejectHostApplication);


// Delete a single request (Developer only, own requests)
router.delete('/:id', authorize('Developer'), async (req, res) => {
  try {
    const Request = require('../models/Request');
    const request = await Request.findOneAndDelete({ _id: req.params.id, developer: req.user.userId });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json({ message: 'Request deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete all requests for the logged-in developer
router.delete('/', authorize('Developer'), async (req, res) => {
  try {
    const Request = require('../models/Request');
    await Request.deleteMany({ developer: req.user.userId });
    res.json({ message: 'All requests deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
