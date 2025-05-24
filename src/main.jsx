import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import EventsPage from './pages/EventsPage';
import ReleasesPage from './pages/ReleasesPage';
import ArchivePage from './pages/ArchivePage';
import EcosystemPage from './pages/EcosystemPage';
import AboutPage from './pages/AboutPage';
import Login from './pages/Login';

import AdminDashboard from './pages/AdminDashboard';
import NewEvents from './pages/admin/NewEvents';
import DeletePastEvents from './pages/admin/DeletePastEvents';
import ManageFutureEvents from './pages/admin/ManageFutureEvents';
import NewRelease from './pages/admin/NewRelease';
import ManageReleases from './pages/admin/ManageReleases';

import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';

import usePageTracking from './hooks/usePageTracking'; // ✅ New

import './index.css';

// ✅ App component handles tracking
function App() {
  usePageTracking();

  return (
    <Routes>
      {/* Redirect root to events */}
      <Route path="/" element={<Navigate to="/events" replace />} />

      {/* Public Pages */}
      <Route path="/events" element={<EventsPage />} />
      <Route path="/releases" element={<ReleasesPage />} />
      <Route path="/archive" element={<ArchivePage />} />
      <Route path="/ecosystem" element={<EcosystemPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/login" element={<Login />} />

      {/* Admin (Protected) Pages */}
      <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/new-events" element={<PrivateRoute><NewEvents /></PrivateRoute>} />
      <Route path="/admin/delete-past-events" element={<PrivateRoute><DeletePastEvents /></PrivateRoute>} />
      <Route path="/admin/manage-events" element={<PrivateRoute><ManageFutureEvents /></PrivateRoute>} />
      <Route path="/admin/new-release" element={<PrivateRoute><NewRelease /></PrivateRoute>} />
      <Route path="/admin/manage-releases" element={<PrivateRoute><ManageReleases /></PrivateRoute>} />
    </Routes>
  );
}

// ✅ Render it all
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <App />
      </Router>
    </AuthProvider>
  </React.StrictMode>
);
