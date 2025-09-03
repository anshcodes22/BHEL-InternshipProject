

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DeveloperDashboard } from './pages/DeveloperDashboard';
import { ReviewerDashboard } from './pages/ReviewerDashboard';
import { HODDashboard } from './pages/HODDashboard';
import { DTGDashboard } from './pages/DTGDashboard';
import { CDTDashboard } from './pages/CDTDashboard';
import { HostingDashboard } from './pages/HostingDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SignupPage } from './pages/SignupPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route 
            path="/developer" 
            element={
              <ProtectedRoute allowedRoles={['Developer']}>
                <DeveloperDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reviewer" 
            element={
              <ProtectedRoute allowedRoles={['Reviewer']}>
                <ReviewerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hod" 
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <HODDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dtg" 
            element={
              <ProtectedRoute allowedRoles={['DTG']}>
                <DTGDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cdt" 
            element={
              <ProtectedRoute allowedRoles={['CDT']}>
                <CDTDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hosting" 
            element={
              <ProtectedRoute allowedRoles={['HostingTeam']}>
                <HostingDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;