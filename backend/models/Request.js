const mongoose = require('mongoose');

const workflowStageSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Hosted'],
    default: 'Pending'
  },
  comment: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  hostedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  hostedAt: Date,
  hash: String,
  dateHosted: Date
});

const RequestSchema = new mongoose.Schema({
  appName: { 
    type: String, 
    required: true 
  },
  developerName: { 
    type: String, 
    required: true 
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  warFile: {
    filename: String,
    path: String,
    hash: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  codeReviewReport: String,
  penTestReport: String,
  checklist: {
    secureGuidelines: { type: Boolean, default: false },
    peerReview: { type: Boolean, default: false },
    passwordPolicy: { type: Boolean, default: false },
    firewallPolicy: { type: Boolean, default: false },
    ptReport: { type: Boolean, default: false },
    auditTrail: { type: Boolean, default: false }
  },
  checklistStatus: { 
    type: String, 
    enum: ['complete', 'partial', 'incomplete'], 
    default: 'incomplete' 
  },
  internetFacing: {
    type: String,
    enum: ['yes', 'no'],
    required: true
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Under Review', 'Approved', 'Rejected', 'Hosted'], 
    default: 'Pending' 
  },
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workflow: {
    reviewer: workflowStageSchema,
    hod: workflowStageSchema,
    dtg: workflowStageSchema,
    cdt: workflowStageSchema,
    hosting: workflowStageSchema
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  remarks: String,
  auditHistory: [
    {
      action: { type: String, enum: ['approved', 'rejected', 'escalated', 'hosted', 'submitted', 'deleted', 'rejected-hosting'] },
      by: { type: String },
      dateTime: { type: Date, default: Date.now },
      remarks: String
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model('Request', RequestSchema);