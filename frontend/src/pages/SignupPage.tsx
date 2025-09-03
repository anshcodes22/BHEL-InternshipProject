import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

const API_BASE_URL = 'http://localhost:5000/api';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    role: 'developer',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.department) newErrors.department = 'Department is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({});
    try {
      // Map frontend role to backend expected role (case sensitive)
      const roleMap: Record<string, string> = {
        developer: 'Developer',
        reviewer: 'Reviewer',
        hod: 'HOD',
        dtg: 'DTG',
        cdt: 'CDT',
        hosting: 'HostingTeam',
        admin: 'Admin',
      };
      const backendRole = roleMap[formData.role] || formData.role;
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: backendRole })
      });
      const data = await response.json();
      if (response.ok) {
        alert('Registration successful! Please login.');
        navigate('/login');
      } else {
        setErrors({ general: data.message || 'Registration failed' });
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign Up</h2>
            <p className="text-gray-600">Create your account</p>
          </div>
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}
              <Input
                label="Name"
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={errors.name}
                required
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={errors.email}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange('password')}
                error={errors.password}
                required
              />
              <Input
                label="Department"
                type="text"
                placeholder="Enter your department"
                value={formData.department}
                onChange={handleInputChange('department')}
                error={errors.department}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={handleInputChange('role')}
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
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? 'Registering...' : 'Sign Up'}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <span className="text-sm text-gray-600">Already have an account? </span>
              <button
                className="text-blue-600 hover:underline text-sm"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
