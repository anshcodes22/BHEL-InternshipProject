import React, { useState, useEffect } from 'react';
import { Building2, Send, CheckCircle, Clock, XCircle, LogOut, FileText, User, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileDropZone } from '../components/FileDropZone';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

interface FormDataType {
  appName: string;
  version: string;
  warFile: File | null;
  codeReviewReport: string;
  penTestReport: string;
  checklist: {
    secureGuidelines: boolean;
    peerReview: boolean;
    passwordPolicy: boolean;
    firewallPolicy: boolean;
    ptReport: boolean;
    auditTrail: boolean;
  };
  internetFacing: 'yes' | 'no' | '';
}

interface Request {
  _id: string;
  appName: string;
  version: string;
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Hosted';
  submissionDate: string;
  checklistStatus: 'complete' | 'partial' | 'incomplete';
  workflow: {
    reviewer: { status: string; comment?: string };
    hod: { status: string; comment?: string };
    dtg: { status: string; comment?: string };
    cdt: { status: string; comment?: string };
    hosting: { status: string; comment?: string };
  };
}

const checklistItems = [
  { key: 'secureGuidelines', label: 'Secure Software Development Guidelines' },
  { key: 'peerReview', label: 'Peer Code Review' },
  { key: 'passwordPolicy', label: 'Password Policy Compliance' },
  { key: 'firewallPolicy', label: 'Firewall Policy Compliance' },
  { key: 'ptReport', label: 'PT Report (Penetration Test)' },
  { key: 'auditTrail', label: 'Audit Trail Enabled' }
];

export const DeveloperDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormDataType>({
    appName: '',
    version: '1.0.0',
    warFile: null,
    codeReviewReport: '',
    penTestReport: '',
    checklist: {
      secureGuidelines: false,
      peerReview: false,
      passwordPolicy: false,
      firewallPolicy: false,
      ptReport: false,
      auditTrail: false
    },
    internetFacing: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      navigate('/');
      return;
    }
    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'Developer') {
        navigate('/');
        return;
      }
      setUser(parsedUser);
      fetchRequests();
    } catch {
      navigate('/');
    }
  }, [navigate]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: File | null) => {
    setFormData(prev => ({ ...prev, warFile: file }));
  };

  const handleChecklistChange = (key: keyof FormDataType['checklist']) => {
    setFormData(prev => ({
      ...prev,
      checklist: { ...prev.checklist, [key]: !prev.checklist[key] }
    }));
  };

  const handleInputChange = (field: keyof FormDataType) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.appName) return alert('Please enter the Application Name');
    if (!formData.warFile) return alert('Please upload a WAR file');
    if (!formData.internetFacing) return alert('Please select if internet facing');
    
    const checkedItems = Object.values(formData.checklist).filter(Boolean).length;
    if (checkedItems === 0) return alert('Please complete at least one checklist item');

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const form = new FormData();
      form.append('appName', formData.appName);
      form.append('developerName', user?.name || '');
      form.append('version', formData.version);
      form.append('warFile', formData.warFile);
      form.append('codeReviewReport', formData.codeReviewReport);
      form.append('penTestReport', formData.penTestReport);
      form.append('internetFacing', formData.internetFacing);
      form.append('checklist', JSON.stringify(formData.checklist));

      const res = await fetch(`${API_BASE_URL}/requests`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });

      const data = await res.json();
      if (res.ok) {
        alert('Application submitted successfully!');
        setFormData({
          appName: '',
          version: '1.0.0',
          warFile: null,
          codeReviewReport: '',
          penTestReport: '',
          checklist: {
            secureGuidelines: false,
            peerReview: false,
            passwordPolicy: false,
            firewallPolicy: false,
            ptReport: false,
            auditTrail: false
          },
          internetFacing: ''
        });
        fetchRequests();
      } else {
        alert(data.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const getStatusBadge = (status: Request['status']) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'Approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'Rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'Under Review':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'Hosted':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getChecklistBadge = (status: Request['checklistStatus']) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'complete':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'partial':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-red-100 text-red-800`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Delete a single request
  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/requests/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setRequests(prev => prev.filter(r => r._id !== id));
      } else {
        alert('Failed to delete request');
      }
    } catch {
      alert('Failed to delete request');
    }
  };

  // Delete all requests
  const handleDeleteAllRequests = async () => {
    if (!window.confirm('Are you sure you want to delete ALL your requests?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/requests`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setRequests([]);
      } else {
        alert('Failed to delete all requests');
      }
    } catch {
      alert('Failed to delete all requests');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">BHEL Developer Dashboard</h1>
                <p className="text-sm text-gray-600">Submit applications for hosting approval</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <Button onClick={handleLogout} size="sm" icon={LogOut}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Submission Form */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">New Application Submission</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Application Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.appName}
                      onChange={handleInputChange('appName')}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter Application Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Version <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.version}
                      onChange={handleInputChange('version')}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="e.g., 1.0.0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WAR File Upload <span className="text-red-500">*</span>
                  </label>
                  <FileDropZone 
                    onFileSelect={handleFileSelect} 
                    selectedFile={formData.warFile} 
                    accept=".war" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code Review Report
                  </label>
                  <textarea
                    value={formData.codeReviewReport}
                    onChange={handleInputChange('codeReviewReport')}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                    placeholder="Enter code review findings and recommendations..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Penetration Test Report
                  </label>
                  <textarea
                    value={formData.penTestReport}
                    onChange={handleInputChange('penTestReport')}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                    placeholder="Enter penetration test results and security assessment..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Compliance Checklist
                  </label>
                  <div className="space-y-3">
                    {checklistItems.map((item) => (
                      <label key={item.key} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.checklist[item.key as keyof FormDataType['checklist']]}
                          onChange={() => handleChecklistChange(item.key as keyof FormDataType['checklist'])}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Internet Facing? <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.internetFacing}
                    onChange={handleInputChange('internetFacing')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select an option</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isSubmitting} 
                  icon={Send}
                  className="w-full"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </form>
            </Card>
          </div>

          {/* Recent Submissions */}
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h3>
              <div className="space-y-3">
                {requests.slice(0, 3).map((request) => (
                  <div key={request._id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{request.appName}</h4>
                      <span className={getStatusBadge(request.status)}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(request.submissionDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {requests.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No submissions yet</p>
                )}
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Submissions</span>
                  <span className="font-medium text-gray-900">{requests.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Approved</span>
                  <span className="font-medium text-green-600">
                    {requests.filter(r => r.status === 'Approved' || r.status === 'Hosted').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Under Review</span>
                  <span className="font-medium text-yellow-600">
                    {requests.filter(r => r.status === 'Under Review').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rejected</span>
                  <span className="font-medium text-red-600">
                    {requests.filter(r => r.status === 'Rejected').length}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* All Submissions Table */}
        <div className="mt-8">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">All Submissions</h2>
              <Button onClick={handleDeleteAllRequests} variant="danger" size="sm" icon={Trash2}>
                Delete All
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">App Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Version</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Checklist</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Current Stage</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => {
                    // Determine current stage with defensive checks
                    let currentStage = 'Reviewer';
                    const wf = request.workflow || {};
                    if (wf.reviewer && wf.reviewer.status === 'Approved') currentStage = 'HOD';
                    if (wf.hod && wf.hod.status === 'Approved') currentStage = 'DTG';
                    if (wf.dtg && wf.dtg.status === 'Approved') currentStage = 'CDT';
                    if (wf.cdt && wf.cdt.status === 'Approved') currentStage = 'Hosting';
                    if (request.status === 'Hosted') currentStage = 'Completed';
                    if (request.status === 'Rejected') currentStage = 'Rejected';

                    return (
                      <tr key={request._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{request.appName}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{request.version}</td>
                        <td className="py-3 px-4">
                          <span className={getStatusBadge(request.status)}>
                            {request.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={getChecklistBadge(request.checklistStatus)}>
                            {request.checklistStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{currentStage}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(request.submissionDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="danger"
                            icon={Trash2}
                            onClick={() => handleDeleteRequest(request._id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {requests.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No submissions yet</p>
                  <p className="text-sm text-gray-400">Submit your first application above</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};