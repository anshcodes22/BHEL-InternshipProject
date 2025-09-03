import React, { useState, useEffect } from 'react';
import { Building2, CheckCircle, XCircle, Clock, LogOut, Upload, Server } from 'lucide-react';
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
    hosting: { status: string; comment?: string; hostedAt?: string; hash?: string };
  };
  createdAt: string;
  updatedAt: string;
}

interface ModalData {
  isOpen: boolean;
  action: 'host' | null;
  requestId: string | null;
  appName: string;
}

export const HostingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [modalData, setModalData] = useState<ModalData>({
    isOpen: false,
    action: null,
    requestId: null,
    appName: ''
  });
  const [hostingData, setHostingData] = useState({
    hash: '',
    dateHosted: ''
  });
  const [isDeploying, setIsDeploying] = useState(false);

  // Add state for reject modal
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; requestId: string | null; appName: string; note: string }>({
    isOpen: false,
    requestId: null,
    appName: '',
    note: ''
  });

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
      if (parsedUser.role !== 'HostingTeam') {
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
        setRequests(data);
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

  const handleHostClick = (requestId: string, appName: string) => {
    setModalData({
      isOpen: true,
      action: 'host',
      requestId,
      appName
    });
    // Set current date/time as default
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setHostingData({ 
      hash: `sha256:${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`, 
      dateHosted: localDateTime 
    });
  };

  const handleModalClose = () => {
    setModalData({
      isOpen: false,
      action: null,
      requestId: null,
      appName: ''
    });
    setHostingData({ hash: '', dateHosted: '' });
  };

  const handleConfirmHosting = async () => {
    const { requestId, appName } = modalData;
    
    if (!requestId || !hostingData.hash || !hostingData.dateHosted) {
      alert('Please fill in all required fields');
      return;
    }

    setIsDeploying(true);
    // Fake deploy illusion: wait 2 seconds, then show success
    setTimeout(async () => {
      // Call backend for real update
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE_URL}/requests/${requestId}/host`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            hash: hostingData.hash,
            dateHosted: hostingData.dateHosted
          })
        });
        // After backend update, refetch requests to update UI
        await fetchRequests();
      } catch {}
      setIsDeploying(false);
      alert(`Application "${appName}" has been hosted successfully!`);
      handleModalClose();
    }, 2000);
  };

  const handleRejectClick = (requestId: string, appName: string) => {
    setRejectModal({ isOpen: true, requestId, appName, note: '' });
  };

  const handleRejectModalClose = () => {
    setRejectModal({ isOpen: false, requestId: null, appName: '', note: '' });
  };

  const handleConfirmReject = async () => {
    if (!rejectModal.requestId || !rejectModal.note.trim()) {
      alert('Please provide a note for rejection.');
      return;
    }
    setIsDeploying(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/requests/${rejectModal.requestId}/host-reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment: rejectModal.note })
      });
      await fetchRequests();
    } catch {}
    setIsDeploying(false);
    alert(`Application "${rejectModal.appName}" has been rejected for deployment.`);
    handleRejectModalClose();
  };

  if (isLoading || isDeploying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-spin" />
          <p className="text-gray-500">{isDeploying ? 'Deploying application...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // Helper filters for correct dashboard logic
  const readyForDeployment = requests.filter(r =>
    r.workflow &&
    r.workflow.hosting &&
    r.workflow.hosting.status !== 'Hosted' &&
    r.workflow.hosting.status !== 'Rejected' &&
    r.workflow.cdt && r.workflow.cdt.status === 'Approved'
  );
  const totalDeployed = requests.filter(r =>
    r.workflow && r.workflow.hosting && r.workflow.hosting.status === 'Hosted'
  );
  const deployedLast7Days = totalDeployed.filter(r =>
    r.workflow.hosting.hostedAt &&
    new Date(r.workflow.hosting.hostedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  );

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
                <h1 className="text-xl font-bold text-gray-900">Hosting Team Dashboard</h1>
                <p className="text-sm text-gray-600">Deploy approved applications</p>
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
            <h3 className="text-2xl font-bold text-gray-900">{readyForDeployment.length}</h3>
            <p className="text-sm text-gray-600">Ready for Deployment</p>
          </Card>
          <Card className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{totalDeployed.length}</h3>
            <p className="text-sm text-gray-600">Total Deployed</p>
          </Card>
          <Card className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-3">
              <Server className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{deployedLast7Days.length}</h3>
            <p className="text-sm text-gray-600">Deployed Last 7 Days</p>
          </Card>
        </div>

        {/* Ready for Deployment Table */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Ready for Deployment</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">App Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Version</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Developer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Approval Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.filter((req: Request) => req.workflow && req.workflow.hosting && req.workflow.hosting.status !== 'Hosted' && req.workflow.hosting.status !== 'Rejected').map((request: Request) => (
                  <tr key={request._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{request.appName}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{request.version}</td>
                    <td className="py-3 px-4 text-gray-600">{request.developer.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        request.workflow.cdt.status === 'Approved' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        CDT: {request.workflow.cdt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{new Date(request.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleHostClick(request._id, request.appName)}
                        disabled={request.workflow.cdt.status !== 'Approved'}
                        icon={Upload}
                      >
                        Deploy
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleRejectClick(request._id, request.appName)}
                        disabled={request.workflow.cdt.status !== 'Approved'}
                        icon={XCircle}
                      >
                        Reject
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {requests.filter(req => req.workflow.hosting.status !== 'Hosted' && req.workflow.hosting.status !== 'Rejected').length === 0 && (
              <div className="text-center py-8">
                <Server className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No applications ready for deployment</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Deployments Table */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Deployments</h2>
          </div>
          <div className="overflow-x-auto">
            {requests.filter((req: Request) => req.workflow && req.workflow.hosting && (req.workflow.hosting.status === 'Hosted' || req.workflow.hosting.status === 'Rejected')).length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">App Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Version</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Developer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Deployment Hash</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Deployed At</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {requests
                    .filter((req: Request) => req.workflow && req.workflow.hosting && (req.workflow.hosting.status === 'Hosted' || req.workflow.hosting.status === 'Rejected'))
                    .sort((a: Request, b: Request) => new Date(b.workflow.hosting.hostedAt || '').getTime() - new Date(a.workflow.hosting.hostedAt || '').getTime())
                    .slice(0, 5)
                    .map((request: Request) => (
                      <tr key={request._id} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{request.appName}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{request.version}</td>
                        <td className="py-3 px-4 text-gray-600">{request.developer.name}</td>
                        <td className="py-3 px-4 text-gray-600 font-mono text-sm">
                          {request.workflow.hosting.hash || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {request.workflow.hosting.hostedAt 
                            ? new Date(request.workflow.hosting.hostedAt).toLocaleString()
                            : 'N/A'
                          }
                        </td>
                        <td className="py-3 px-4">
                          {request.workflow.hosting.status === 'Hosted' ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Deployed</span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Rejected</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {request.workflow.hosting.comment || '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                <Server className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No recent deployments</p>
              </div>
            )}
          </div>
        </Card>

        {/* All Deployed Applications Table */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Deployed Applications</h2>
          </div>
          <div className="overflow-x-auto">
            {requests.filter((req: Request) => req.workflow && req.workflow.hosting && req.workflow.hosting.status === 'Hosted').length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">App Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Version</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Developer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Deployment Hash</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Deployed At</th>
                  </tr>
                </thead>
                <tbody>
                  {requests
                    .filter((req: Request) => req.workflow && req.workflow.hosting && req.workflow.hosting.status === 'Hosted')
                    .sort((a: Request, b: Request) => new Date(b.workflow.hosting.hostedAt || '').getTime() - new Date(a.workflow.hosting.hostedAt || '').getTime())
                    .map((request: Request) => (
                      <tr key={request._id} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{request.appName}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{request.version}</td>
                        <td className="py-3 px-4 text-gray-600">{request.developer.name}</td>
                        <td className="py-3 px-4 text-gray-600">{request.developer.department}</td>
                        <td className="py-3 px-4 text-gray-600 font-mono text-sm">
                          {request.workflow.hosting.hash || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {request.workflow.hosting.hostedAt 
                            ? new Date(request.workflow.hosting.hostedAt).toLocaleString()
                            : 'N/A'
                          }
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                <Server className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No deployed applications</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Hosting Modal */}
      <Modal
        isOpen={modalData.isOpen}
        onClose={handleModalClose}
        title="Deploy Application"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              You are about to deploy the application:
            </p>
            <p className="font-medium text-gray-900">{modalData.appName}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deployment Hash <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={hostingData.hash}
              onChange={(e) => setHostingData(prev => ({ ...prev, hash: e.target.value }))}
              placeholder="Enter deployment hash (auto-generated)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This hash will be used to verify the deployed application
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deployment Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={hostingData.dateHosted}
              onChange={(e) => setHostingData(prev => ({ ...prev, dateHosted: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>
          
          <div className="overflow-x-auto">
            {requests.filter((req: Request) => req.workflow && req.workflow.hosting && req.workflow.hosting.status === 'Hosted').length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">App Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Version</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Developer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Deployment Hash</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Deployed At</th>
                  </tr>
                </thead>
                <tbody>
                  {requests
                    .filter((req: Request) => req.workflow && req.workflow.hosting && req.workflow.hosting.status === 'Hosted')
                    .sort((a: Request, b: Request) => new Date(b.workflow.hosting.hostedAt || '').getTime() - new Date(a.workflow.hosting.hostedAt || '').getTime())
                    .map((request: Request) => (
                      <tr key={request._id} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{request.appName}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{request.version}</td>
                        <td className="py-3 px-4 text-gray-600">{request.developer.name}</td>
                        <td className="py-3 px-4 text-gray-600">{request.developer.department}</td>
                        <td className="py-3 px-4 text-gray-600 font-mono text-sm">
                          {request.workflow.hosting.hash || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {request.workflow.hosting.hostedAt 
                            ? new Date(request.workflow.hosting.hostedAt).toLocaleString()
                            : 'N/A'
                          }
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                <Server className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No deployed applications</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-4">
          <Button variant="secondary" onClick={handleModalClose}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleConfirmHosting}>
            Confirm Deploy
          </Button>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModal.isOpen}
        onClose={handleRejectModalClose}
        title="Reject Deployment"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              You are about to reject the deployment for:
            </p>
            <p className="font-medium text-gray-900">{rejectModal.appName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectModal.note}
              onChange={e => setRejectModal(prev => ({ ...prev, note: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={4}
              required
            />
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <Button variant="secondary" onClick={handleRejectModalClose}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmReject}>
              Confirm Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};