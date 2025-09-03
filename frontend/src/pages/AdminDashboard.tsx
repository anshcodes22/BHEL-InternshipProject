import React, { useState, useEffect } from 'react';
import { Building2, Users, Plus, Edit, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'developer' | 'reviewer' | 'hod' | 'dtg' | 'cdt' | 'hosting' | 'admin';
}

interface ModalData {
  isOpen: boolean;
  type: 'add' | 'edit' | null;
  user?: User;
}

const mockUsers: User[] = [
  { id: '1', name: 'John Developer', email: 'developer@bhel.com', role: 'developer' },
  { id: '2', name: 'Jane Reviewer', email: 'reviewer@bhel.com', role: 'reviewer' },
  { id: '3', name: 'Dr. Sarah Johnson', email: 'hod@bhel.com', role: 'hod' },
  { id: '4', name: 'Mike DTG', email: 'dtg@bhel.com', role: 'dtg' },
  { id: '5', name: 'Alex CDT', email: 'cdt@bhel.com', role: 'cdt' },
  { id: '6', name: 'Sam Hosting', email: 'hosting@bhel.com', role: 'hosting' },
  { id: '7', name: 'Admin User', email: 'admin@bhel.com', role: 'admin' },
];

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [modalData, setModalData] = useState<ModalData>({ isOpen: false, type: null });
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'developer' as User['role'],
    department: ''
  });

  // Fetch real users from backend (admin only)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://localhost:5000/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const emails = new Set(mockUsers.map(u => u.email));
          const realUsers = data.filter(u => !emails.has(u.email)).map(u => ({
            id: u._id || u.id,
            name: u.name,
            email: u.email,
            role: (u.role || '').toLowerCase() as User['role']
          }));
          setUsers([...mockUsers, ...realUsers]);
        }
      })
      .catch(() => {});
  }, []);

  const handleAddUser = () => {
    setModalData({ isOpen: true, type: 'add' });
    setUserForm({ name: '', email: '', password: '', role: 'developer', department: '' });
  };

  const handleEditUser = (user: User) => {
    setModalData({ isOpen: true, type: 'edit', user });
    setUserForm({ name: user.name, email: user.email, password: '', role: user.role, department: '' });
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"?`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        alert('Failed to delete user from server.');
        return;
      }
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch {
      alert('Failed to delete user.');
    }
  };

  const handleModalClose = () => {
    setModalData({ isOpen: false, type: null });
    setUserForm({ name: '', email: '', password: '', role: 'developer', department: '' });
  };

  const handleUserSubmit = async () => {
    if (!userForm.name || !userForm.email || !userForm.department || (!modalData.user && !userForm.password)) {
      alert('Please fill in all required fields');
      return;
    }

    if (modalData.type === 'add') {
      try {
        const roleMap: Record<string, string> = {
          developer: 'Developer',
          reviewer: 'Reviewer',
          hod: 'HOD',
          dtg: 'DTG',
          cdt: 'CDT',
          hosting: 'HostingTeam',
          admin: 'Admin',
        };
        const backendRole = roleMap[userForm.role] || userForm.role;

        const res = await fetch('http://localhost:5000/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: userForm.name,
            email: userForm.email,
            password: userForm.password,
            role: backendRole,
            department: userForm.department
          })
        });

        if (!res.ok) throw new Error('Failed to register user');
        const data = await res.json();

        const newUser: User = {
          id: data.user?.id || Date.now().toString(),
          name: data.user?.name || userForm.name,
          email: data.user?.email || userForm.email,
          role: (data.user?.role || userForm.role) as User['role']
        };
        setUsers(prev => [...prev, newUser]);
        alert('User registered successfully!');
      } catch {
        alert('Failed to register user.');
      }
    } else if (modalData.type === 'edit' && modalData.user) {
      setUsers(prev => prev.map(user => 
        user.id === modalData.user!.id 
          ? { ...user, name: userForm.name, email: userForm.email, role: userForm.role }
          : user
      ));
    }
    handleModalClose();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Manage users</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Management */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
            <Button onClick={handleAddUser} icon={Plus}>
              Add User
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEditUser(user)}
                          icon={Edit}
                        >
                          Edit Role
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          icon={Trash2}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* User Modal */}
      <Modal
        isOpen={modalData.isOpen}
        onClose={handleModalClose}
        title={modalData.type === 'add' ? 'Add New User' : 'Edit User'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={userForm.name}
              onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={userForm.department}
              onChange={(e) => setUserForm(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter department"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address"
            />
          </div>
          
          {modalData.type === 'add' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={userForm.role}
              onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as User['role'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="developer">Developer</option>
              <option value="reviewer">Reviewer</option>
              <option value="hod">HOD</option>
              <option value="dtg">DTG</option>
              <option value="cdt">CDT</option>
              <option value="hosting">Hosting</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              variant="primary"
              onClick={handleUserSubmit}
              className="flex-1"
            >
              {modalData.type === 'add' ? 'Add User' : 'Update User'}
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
