const Request = require('../models/Request');
const User = require('../models/User');
const { generateFileHash } = require('../middleware/upload');
const fs = require('fs');

const calculateChecklistStatus = (checklist) => {
  const totalItems = 6;
  const completedCount = Object.values(checklist).filter(Boolean).length;

  if (completedCount === totalItems) return 'complete';
  if (completedCount > 0) return 'partial';
  return 'incomplete';
};

// Create new request (Developer only)
const createRequest = async (req, res) => {
  try {
    const { appName, developerName, version, codeReviewReport, penTestReport, checklist, internetFacing } = req.body;

    if (!appName || !developerName) {
      return res.status(400).json({ message: 'appName and developerName are required.' });
    }

    if (!internetFacing) {
      return res.status(400).json({ message: 'internetFacing is required.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'WAR file is required' });
    }

    // Generate file hash
    const fileHash = await generateFileHash(req.file.path);

    // Parse checklist safely
    const checklistObj = typeof checklist === 'string' ? JSON.parse(checklist) : checklist || {};

    // Calculate checklist status
    const checklistStatus = calculateChecklistStatus(checklistObj);

    const request = new Request({
      appName,
      developerName,
      version: version || '1.0.0',
      warFile: {
        filename: req.file.filename,
        path: req.file.path,
        hash: fileHash,
        uploadDate: new Date()
      },
      codeReviewReport,
      penTestReport,
      checklist: checklistObj,
      checklistStatus,
      internetFacing,
      developer: req.user.userId,
      workflow: {
        reviewer: { status: 'Pending' },
        hod: { status: 'Pending' },
        dtg: { status: 'Pending' },
        cdt: { status: 'Pending' },
        hosting: { status: 'Pending' }
      }
    });

    await request.save();

    res.status(201).json({
      message: 'Request created successfully',
      request
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get requests based on user role
const getRequests = async (req, res) => {
  try {
    const { role } = req.user;
    let query = {};

    switch (role) {
      case 'Developer':
        query.developer = req.user.userId;
        break;
      case 'Reviewer':
        // Return all requests for the reviewer, regardless of status
        break;
      case 'HOD':
        // Return all requests for HOD, regardless of status
        break;
      case 'DTG':
        // Return all requests for DTG, regardless of status
        break;
      case 'CDT':
        // Return all requests for CDT, regardless of status
        break;
      case 'HostingTeam':
        // Use $nin for correct MongoDB syntax
        query = {
          $or: [
            { 'workflow.hosting.status': { $nin: ['Hosted', 'Rejected'] }, 'workflow.cdt.status': 'Approved' },
            { 'workflow.hosting.status': 'Hosted' },
            { 'workflow.hosting.status': 'Rejected' }
          ]
        };
        break;
      case 'Admin':
        // Admin can see all requests
        break;
      default:
        return res.status(403).json({ message: 'Invalid role' });
    }

    const requests = await Request.find(query)
      .populate('developer', 'name email department')
      .populate('workflow.reviewer.reviewedBy', 'name email')
      .populate('workflow.hod.reviewedBy', 'name email')
      .populate('workflow.dtg.reviewedBy', 'name email')
      .populate('workflow.cdt.reviewedBy', 'name email')
      .populate('workflow.hosting.hostedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single request
const getRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('developer', 'name email department')
      .populate('workflow.reviewer.reviewedBy', 'name email')
      .populate('workflow.hod.reviewedBy', 'name email')
      .populate('workflow.dtg.reviewedBy', 'name email')
      .populate('workflow.cdt.reviewedBy', 'name email')
      .populate('workflow.hosting.hostedBy', 'name email');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve request
const approveRequest = async (req, res) => {
  try {
    const { comment } = req.body;
    const { role } = req.user;
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const canApprove = checkApprovalPermission(request, role);
    if (!canApprove) {
      return res.status(403).json({ message: 'Cannot approve at this stage' });
    }

    const workflowStage = getWorkflowStage(role);
    request.workflow[workflowStage].status = 'Approved';
    request.workflow[workflowStage].comment = comment;
    request.workflow[workflowStage].reviewedBy = req.user.userId;
    request.workflow[workflowStage].reviewedAt = new Date();

    updateOverallStatus(request);

    // Add audit history entry
    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      action: 'approved',
      by: req.user.name || req.user.email || req.user.userId,
      dateTime: new Date(),
      remarks: comment || ''
    });

    await request.save();

    res.json({
      message: 'Request approved successfully',
      request
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject request
const rejectRequest = async (req, res) => {
  try {
    const { comment } = req.body;
    const { role } = req.user;
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const canReject = checkApprovalPermission(request, role);
    if (!canReject) {
      return res.status(403).json({ message: 'Cannot reject at this stage' });
    }

    const workflowStage = getWorkflowStage(role);
    request.workflow[workflowStage].status = 'Rejected';
    request.workflow[workflowStage].comment = comment;
    request.workflow[workflowStage].reviewedBy = req.user.userId;
    request.workflow[workflowStage].reviewedAt = new Date();

    request.status = 'Rejected';

    // Add audit history entry
    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      action: 'rejected',
      by: req.user.name || req.user.email || req.user.userId,
      dateTime: new Date(),
      remarks: comment || ''
    });

    await request.save();

    res.json({
      message: 'Request rejected successfully',
      request
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Host application (Hosting Team only)
// Reject deployment (Hosting Team only)
const rejectHostApplication = async (req, res) => {
  try {
    const { comment } = req.body;
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only allow rejection if not already hosted or rejected
    if (request.workflow.hosting.status === 'Hosted' || request.workflow.hosting.status === 'Rejected') {
      return res.status(400).json({ message: 'Request already hosted or rejected' });
    }

    request.workflow.hosting.status = 'Rejected';
    request.workflow.hosting.comment = comment;
    request.workflow.hosting.hostedAt = new Date();
    request.status = 'Rejected';

    // Add audit history entry
    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      action: 'rejected-hosting',
      by: req.user.name || req.user.email || req.user.userId,
      dateTime: new Date(),
      remarks: comment || ''
    });

    await request.save();

    res.json({
      message: 'Deployment rejected successfully',
      request
    });
  } catch (error) {
    console.error('Reject host application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
const hostApplication = async (req, res) => {
  try {
    const { hash, dateHosted } = req.body;
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (!isReadyForHosting(request)) {
      return res.status(403).json({ message: 'Request not ready for hosting' });
    }

  request.workflow.hosting.status = 'Hosted';
  request.workflow.hosting.hash = hash;
  // Set both hostedAt and dateHosted for compatibility
  const hostedDate = dateHosted ? new Date(dateHosted) : new Date();
  request.workflow.hosting.dateHosted = hostedDate;
  request.workflow.hosting.hostedAt = hostedDate;
  request.workflow.hosting.hostedBy = req.user.userId;

  request.status = 'Hosted';

    // Add audit history entry
    request.auditHistory = request.auditHistory || [];
    request.auditHistory.push({
      action: 'hosted',
      by: req.user.name || req.user.email || req.user.userId,
      dateTime: new Date(),
      remarks: ''
    });

    await request.save();

    res.json({
      message: 'Application hosted successfully',
      request
    });
  } catch (error) {
    console.error('Host application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper functions
const checkApprovalPermission = (request, role) => {
  switch (role) {
    case 'Reviewer':
      return request.workflow.reviewer.status === 'Pending';
    case 'HOD':
      return request.workflow.hod.status === 'Pending' && 
             request.workflow.reviewer.status === 'Approved';
    case 'DTG':
      return request.workflow.dtg.status === 'Pending' && 
             request.workflow.hod.status === 'Approved';
    case 'CDT':
      return request.workflow.cdt.status === 'Pending' && 
             request.workflow.dtg.status === 'Approved';
    case 'HostingTeam':
      return request.workflow.hosting.status === 'Pending' && 
             request.workflow.cdt.status === 'Approved';
    default:
      return false;
  }
};

const getWorkflowStage = (role) => {
  const stageMap = {
    'Reviewer': 'reviewer',
    'HOD': 'hod',
    'DTG': 'dtg',
    'CDT': 'cdt',
    'HostingTeam': 'hosting'
  };
  return stageMap[role];
};

const updateOverallStatus = (request) => {
  const { reviewer, hod, dtg, cdt, hosting } = request.workflow;
  
  if (hosting.status === 'Hosted') {
    request.status = 'Hosted';
  } else if (cdt.status === 'Approved' ||
             dtg.status === 'Approved' ||
             hod.status === 'Approved' ||
             reviewer.status === 'Approved') {
    request.status = 'Under Review';
  }
};

const isReadyForHosting = (request) => {
  return request.workflow.reviewer.status === 'Approved' &&
         request.workflow.hod.status === 'Approved' &&
         request.workflow.dtg.status === 'Approved' &&
         request.workflow.cdt.status === 'Approved';
};

module.exports = {
  createRequest,
  getRequests,
  getRequest,
  approveRequest,
  rejectRequest,
  hostApplication,
  rejectHostApplication
};