// Backend controller for admin audit trail and global tracing endpoints
const Request = require('../models/Request');

// Get all audit trail entries (flattened from all requests)
const getAuditTrail = async (req, res) => {
  try {
    console.log('[DEBUG] /api/audit called by user:', req.user);
    if (!req.user || req.user.role !== 'Admin') {
      console.log('[DEBUG] Forbidden: user not admin');
      return res.status(403).json({ message: 'Forbidden' });
    }
    const requests = await Request.find({}, 'appName auditHistory').lean();
    const auditTrail = [];
    for (const reqDoc of requests) {
      if (Array.isArray(reqDoc.auditHistory)) {
        for (const entry of reqDoc.auditHistory) {
          auditTrail.push({
            appName: reqDoc.appName,
            ...entry,
            id: entry._id || `${reqDoc._id}-${entry.dateTime}`
          });
        }
      }
    }
    console.log('[DEBUG] Returning auditTrail:', auditTrail);
    res.json(auditTrail);
  } catch (error) {
    console.error('[DEBUG] Server error in getAuditTrail:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get global application status for all requests
const getGlobalStatus = async (req, res) => {
  try {
    console.log('[DEBUG] /api/global-status called by user:', req.user);
    if (!req.user || req.user.role !== 'Admin') {
      console.log('[DEBUG] Forbidden: user not admin');
      return res.status(403).json({ message: 'Forbidden' });
    }
    const requests = await Request.find({})
      .populate('developer', 'name')
      .lean();
    const statusList = requests.map(r => {
      let currentStage = 'developer';
      let currentApprover = r.developer?.name || '';
      if (r.workflow?.reviewer?.status === 'Approved') {
        currentStage = 'hod';
        currentApprover = r.workflow.hod?.reviewedBy?.name || '';
      }
      if (r.workflow?.hod?.status === 'Approved') {
        currentStage = 'dtg';
        currentApprover = r.workflow.dtg?.reviewedBy?.name || '';
      }
      if (r.workflow?.dtg?.status === 'Approved') {
        currentStage = 'cdt';
        currentApprover = r.workflow.cdt?.reviewedBy?.name || '';
      }
      if (r.workflow?.cdt?.status === 'Approved') {
        currentStage = 'hosting';
        currentApprover = r.workflow.hosting?.hostedBy?.name || '';
      }
      let status = r.status?.toLowerCase() || 'pending';
      if (status === 'hosted') status = 'hosted';
      if (status === 'rejected') status = 'rejected';
      if (status === 'approved') status = 'approved';
      if (status === 'escalated') status = 'escalated';
      return {
        id: r._id,
        appName: r.appName,
        currentStage,
        currentApprover,
        status,
        lastUpdated: r.updatedAt || r.createdAt
      };
    });
    console.log('[DEBUG] Returning global status:', statusList);
    res.json(statusList);
  } catch (error) {
    console.error('[DEBUG] Server error in getGlobalStatus:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAuditTrail, getGlobalStatus };
