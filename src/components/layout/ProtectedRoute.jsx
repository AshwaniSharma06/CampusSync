import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ user, children, redirectPath = '/' }) {
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }
  
  return children;
}
