import React, { useState, useEffect } from 'react';
import { Building2, CheckCircle, XCircle, Clock, LogOut } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useNavigate } from 'react-router-dom';

// API configuration
const API_BASE_URL = 'http://localhost:5000/api';

interface Request {
  _id: string;
  appName: string;
  version: string;
  warFile: {
    filename: string;
    path: string;
    hash: string;
    uploadDate: string;
  };
  codeReviewReport: string;
  penTestReport: string;
  checklist: string;
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Hosted';
  developer: {
    _id: string;
    name: string;
    email: string;
    department: string;
  };
  workflow: {
    reviewer: { status: string; comment?: string; reviewedAt?: string };
    hod: { status: string; comment?: string; reviewedAt?: string };
    dtg: { status: string; comment?: string; reviewedAt?: string };
    cdt: { status: string; comment?: string; reviewedAt?: string };
    hosting: { status: string; comment?: string; hostedAt?: string };
  };
  createdAt: string;
  updatedAt: string;
}

interface ModalData {
  isOpen: boolean;
  action: 'approve' | 'reject' | null;
  requestId: string | null;
  appName: string;
}

export const CDTDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]);
  const [allRequests, setAllRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<Request[]>([]);
  const [modalData, setModalData] = useState<ModalData>({
    isOpen: false,
    action: null,
    requestId: null,
    appName: ''
  });
  const [remarks, setRemarks] = useState('');

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'CDT') {
        navigate('/');
        return;
      }
      setUser(parsedUser);
      fetchRequests();
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/');
    }
  }, [navigate]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAllRequests(data);
        setRequests(data.filter((r: Request) => r.workflow && r.workflow.cdt && (r.workflow.cdt.status === 'Pending' || r.workflow.cdt.status === 'Under Review')));
        setRecentSubmissions(
          data.filter((r: Request) =>
            r.workflow && r.workflow.cdt &&
            (r.workflow.cdt.status === 'Approved' || r.workflow.cdt.status === 'Rejected') &&
            r.workflow.cdt.reviewedAt &&
            r.workflow.cdt.comment !== undefined
          ).sort((a: Request, b: Request) => new Date(b.workflow.cdt.reviewedAt || '').getTime() - new Date(a.workflow.cdt.reviewedAt || '').getTime())
        );
      } else {
        console.error('Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleActionClick = (action: 'approve' | 'reject', requestId: string, appName: string) => {
    setModalData({
      isOpen: true,
      action,
      requestId,
      appName
    });
    setRemarks('');
  };

  const handleModalClose = () => {
    setModalData({
      isOpen: false,
      action: null,
      requestId: null,
      appName: ''
    });
    setRemarks('');
  };

  const handleConfirmAction = async () => {
    const { action, requestId, appName } = modalData;
    
    if (!requestId) return;

    try {
      const token = localStorage.getItem('token');
      const endpoint = action === 'approve' ? 'approve' : 'reject';
      
      const response = await fetch(`${API_BASE_URL}/requests/${requestId}/${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comment: remarks.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Application "${appName}" has been ${action}d successfully!`);
        
        // Refresh requests list
        fetchRequests();
      } else {
        alert(data.message || `Failed to ${action} application`);
      }
    } catch (error) {
      console.error('Error processing action:', error);
      alert('Network error. Please try again.');
    }
    
    // Close modal
    handleModalClose();
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
                <h1 className="text-xl font-bold text-gray-900">CDT Dashboard</h1>
                <p className="text-sm text-gray-600">Central Development Team Review</p>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{allRequests.filter(r => r.workflow && r.workflow.cdt && (r.workflow.cdt.status === 'Pending' || r.workflow.cdt.status === 'Under Review')).length}</h3>
            <p className="text-sm text-gray-600">Pending Reviews</p>
          </Card>
          <Card className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{allRequests.filter(r => r.workflow && r.workflow.cdt && r.workflow.cdt.status === 'Approved').length}</h3>
            <p className="text-sm text-gray-600">Approved</p>
          </Card>
          <Card className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mx-auto mb-3">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{allRequests.filter(r => r.workflow && r.workflow.cdt && r.workflow.cdt.status === 'Rejected').length}</h3>
            <p className="text-sm text-gray-600">Rejected</p>
          </Card>
        </div>

        {/* Pending Reviews Table */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Pending Reviews</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">App Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Version</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Developer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Previous Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{request.appName}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{request.version}</td>
                    <td className="py-3 px-4 text-gray-600">{request.developer.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        request.workflow.dtg.status === 'Approved' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        DTG: {request.workflow.dtg.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{new Date(request.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleActionClick('approve', request._id, request.appName)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleActionClick('reject', request._id, request.appName)}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {requests.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No pending reviews</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Submissions Section */}
        <Card className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Submissions (Your Actions)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">App Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Version</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Developer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Remarks</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-6 text-gray-500">No recent actions</td></tr>
                ) : recentSubmissions.map((r) => (
                  <tr key={r._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{r.appName}</td>
                    <td className="py-3 px-4">{r.version}</td>
                    <td className="py-3 px-4">{r.developer?.name || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${r.workflow.cdt.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{r.workflow.cdt.status}</span>
                    </td>
                    <td className="py-3 px-4">{r.workflow.cdt.comment || '-'}</td>
                    <td className="py-3 px-4">{r.workflow.cdt.reviewedAt ? new Date(r.workflow.cdt.reviewedAt).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Action Modal */}
      <Modal
        isOpen={modalData.isOpen}
        onClose={handleModalClose}
        title={`${modalData.action === 'approve' ? 'Approve' : 'Reject'} Application`}
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              You are about to <strong>{modalData.action}</strong> the application:
            </p>
            <p className="font-medium text-gray-900">{modalData.appName}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks (Optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={`Enter ${modalData.action === 'approve' ? 'approval' : 'rejection'} remarks...`}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              variant={modalData.action === 'approve' ? 'success' : 'danger'}
              onClick={handleConfirmAction}
              className="flex-1"
              icon={modalData.action === 'approve' ? CheckCircle : XCircle}
            >
              Confirm {modalData.action === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleModalClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}; 