const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUsers = [
  { email: 'dev@bhel.com', password: 'dev123', role: 'Developer' },
  { email: 'rev@bhel.com', password: 'rev123', role: 'Reviewer' },
  { email: 'hod@bhel.com', password: 'hod123', role: 'HOD' },
  { email: 'dtg@bhel.com', password: 'dtg123', role: 'DTG' },
  { email: 'cdt@bhel.com', password: 'cdt123', role: 'CDT' },
  { email: 'host@bhel.com', password: 'host123', role: 'HostingTeam' },
  { email: 'admin@bhel.com', password: 'admin123', role: 'Admin' }
];

let tokens = {};

// Helper function to make authenticated requests
const makeAuthRequest = (token) => {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Test authentication
const testAuthentication = async () => {
  console.log('🔐 Testing Authentication...');
  
  for (const user of testUsers) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: user.email,
        password: user.password
      });
      
      tokens[user.role] = response.data.token;
      console.log(`✅ ${user.role} login successful`);
    } catch (error) {
      console.log(`❌ ${user.role} login failed:`, error.response?.data?.message || error.message);
    }
  }
};

// Test getting current user
const testGetCurrentUser = async () => {
  console.log('\n👤 Testing Get Current User...');
  
  for (const [role, token] of Object.entries(tokens)) {
    try {
      const authRequest = makeAuthRequest(token);
      const response = await authRequest.get('/auth/me');
      console.log(`✅ ${role} current user:`, response.data.email);
    } catch (error) {
      console.log(`❌ ${role} get current user failed:`, error.response?.data?.message || error.message);
    }
  }
};

// Test getting requests (filtered by role)
const testGetRequests = async () => {
  console.log('\n📋 Testing Get Requests...');
  
  for (const [role, token] of Object.entries(tokens)) {
    try {
      const authRequest = makeAuthRequest(token);
      const response = await authRequest.get('/requests');
      console.log(`✅ ${role} requests count:`, response.data.length);
    } catch (error) {
      console.log(`❌ ${role} get requests failed:`, error.response?.data?.message || error.message);
    }
  }
};

// Test health endpoint
const testHealthEndpoint = async () => {
  console.log('\n🏥 Testing Health Endpoint...');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check successful:', response.data.message);
  } catch (error) {
    console.log('❌ Health check failed:', error.response?.data?.message || error.message);
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting Backend Tests...\n');
  
  try {
    await testHealthEndpoint();
    await testAuthentication();
    await testGetCurrentUser();
    await testGetRequests();
    
    console.log('\n✅ All tests completed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Create a request as Developer');
    console.log('2. Approve/reject as Reviewer');
    console.log('3. Continue through workflow stages');
    console.log('4. Deploy as Hosting Team');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, tokens }; 