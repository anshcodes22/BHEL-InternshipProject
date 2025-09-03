const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Request = require('../models/Request');
const connectDB = require('./database');

const seedUsers = async () => {
  try {
    await connectDB();

    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('Users already seeded. Skipping user seeding...');
    } else {
      const users = [
        {
          email: 'dev@bhel.com',
          password: 'dev123',
          role: 'Developer',
          name: 'John Developer',
          department: 'Software Development'
        },
        {
          email: 'rev@bhel.com',
          password: 'rev123',
          role: 'Reviewer',
          name: 'Sarah Reviewer',
          department: 'Code Review'
        },
        {
          email: 'hod@bhel.com',
          password: 'hod123',
          role: 'HOD',
          name: 'Mike HOD',
          department: 'Head of Department'
        },
        {
          email: 'dtg@bhel.com',
          password: 'dtg123',
          role: 'DTG',
          name: 'Lisa DTG',
          department: 'Digital Technology Group'
        },
        {
          email: 'cdt@bhel.com',
          password: 'cdt123',
          role: 'CDT',
          name: 'David CDT',
          department: 'Central Development Team'
        },
        {
          email: 'host@bhel.com',
          password: 'host123',
          role: 'HostingTeam',
          name: 'Alex Hosting',
          department: 'Hosting Team'
        },
        {
          email: 'admin@bhel.com',
          password: 'admin123',
          role: 'Admin',
          name: 'Admin User',
          department: 'Administration'
        }
      ];

      for (const userData of users) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        const user = new User({
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          name: userData.name,
          department: userData.department
        });

        await user.save();
        console.log(`Created user: ${userData.email} (${userData.role})`);
      }

      console.log('All users seeded successfully!');
    }

    // Seed mock requests
    await seedMockRequests();

  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

const seedMockRequests = async () => {
  try {
    // Check if requests already exist
    const existingRequests = await Request.countDocuments();
    if (existingRequests > 0) {
      console.log('Mock requests already seeded. Skipping...');
      return;
    }

    // Get users for references
    const developer = await User.findOne({ role: 'Developer' });
    const reviewer = await User.findOne({ role: 'Reviewer' });
    const hod = await User.findOne({ role: 'HOD' });
    const dtg = await User.findOne({ role: 'DTG' });

    if (!developer) {
      console.log('No developer found. Skipping mock request seeding.');
      return;
    }

    const mockRequests = [
      {
        appName: 'Employee Portal v2.1',
        developerName: developer.name,
        version: '2.1.0',
        warFile: {
          filename: 'employee-portal-v2.1.war',
          path: 'uploads/employee-portal-v2.1.war',
          hash: 'sha256:abc123def456789',
          uploadDate: new Date('2024-01-10')
        },
        codeReviewReport: 'Code review completed successfully. All security guidelines followed.',
        penTestReport: 'Penetration testing passed with no critical vulnerabilities.',
        checklist: {
          secureGuidelines: true,
          peerReview: true,
          passwordPolicy: true,
          firewallPolicy: true,
          ptReport: true,
          auditTrail: true
        },
        checklistStatus: 'complete',
        internetFacing: 'yes',
        status: 'Under Review',
        developer: developer._id,
        workflow: {
          reviewer: {
            status: 'Approved',
            comment: 'All checklist items completed. Code quality is excellent.',
            reviewedBy: reviewer?._id,
            reviewedAt: new Date('2024-01-11')
          },
          hod: { status: 'Pending' },
          dtg: { status: 'Pending' },
          cdt: { status: 'Pending' },
          hosting: { status: 'Pending' }
        },
        submissionDate: new Date('2024-01-10')
      },
      {
        appName: 'Customer Support Dashboard',
        developerName: developer.name,
        version: '1.5.0',
        warFile: {
          filename: 'customer-support-v1.5.war',
          path: 'uploads/customer-support-v1.5.war',
          hash: 'sha256:def456ghi789abc',
          uploadDate: new Date('2024-01-12')
        },
        codeReviewReport: 'Code review in progress. Minor issues identified.',
        penTestReport: 'Penetration testing scheduled for next week.',
        checklist: {
          secureGuidelines: true,
          peerReview: true,
          passwordPolicy: false,
          firewallPolicy: true,
          ptReport: false,
          auditTrail: true
        },
        checklistStatus: 'partial',
        internetFacing: 'no',
        status: 'Pending',
        developer: developer._id,
        workflow: {
          reviewer: { status: 'Pending' },
          hod: { status: 'Pending' },
          dtg: { status: 'Pending' },
          cdt: { status: 'Pending' },
          hosting: { status: 'Pending' }
        },
        submissionDate: new Date('2024-01-12')
      },
      {
        appName: 'Financial Reporting Tool',
        developerName: developer.name,
        version: '3.0.0',
        warFile: {
          filename: 'financial-reporting-v3.0.war',
          path: 'uploads/financial-reporting-v3.0.war',
          hash: 'sha256:ghi789jkl012mno',
          uploadDate: new Date('2024-01-08')
        },
        codeReviewReport: 'Comprehensive code review completed.',
        penTestReport: 'Security assessment passed with recommendations implemented.',
        checklist: {
          secureGuidelines: true,
          peerReview: true,
          passwordPolicy: true,
          firewallPolicy: true,
          ptReport: true,
          auditTrail: true
        },
        checklistStatus: 'complete',
        internetFacing: 'yes',
        status: 'Under Review',
        developer: developer._id,
        workflow: {
          reviewer: {
            status: 'Approved',
            comment: 'Excellent work. All requirements met.',
            reviewedBy: reviewer?._id,
            reviewedAt: new Date('2024-01-09')
          },
          hod: {
            status: 'Approved',
            comment: 'Approved for next stage.',
            reviewedBy: hod?._id,
            reviewedAt: new Date('2024-01-10')
          },
          dtg: {
            status: 'Approved',
            comment: 'Technical review completed successfully.',
            reviewedBy: dtg?._id,
            reviewedAt: new Date('2024-01-11')
          },
          cdt: { status: 'Pending' },
          hosting: { status: 'Pending' }
        },
        submissionDate: new Date('2024-01-08')
      }
    ];

    for (const requestData of mockRequests) {
      const request = new Request(requestData);
      await request.save();
      console.log(`Created mock request: ${requestData.appName}`);
    }

    console.log('Mock requests seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding mock requests:', error);
    process.exit(1);
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

seedUsers();