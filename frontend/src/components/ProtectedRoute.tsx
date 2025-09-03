import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');

  // Check if user is authenticated
  if (!token || !userData) {
    return <Navigate to="/" replace />;
  }

  try {
    const user = JSON.parse(userData);
    
    // If specific roles are required, check if user has the required role
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    console.error('Error parsing user data:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/" replace />;
  }
}; 