import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ user, children, redirectPath = '/' }) {
  const demoUser = localStorage.getItem('campussync_demo_user');
  const studentProfile = localStorage.getItem('campussync_student_profile');
  
  // Only allow access if user is authenticated via Firebase, Demo access, or has registered profile
  const isAuthenticated = Boolean(user || demoUser || studentProfile);

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }
  
  return children;
}
