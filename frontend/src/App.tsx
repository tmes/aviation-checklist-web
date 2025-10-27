import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { useDarkMode } from './hooks/useDarkMode';
import './lib/i18n'; // Initialize i18n

import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Settings from './pages/Settings';
import ChecklistExecution from './pages/ChecklistExecution';

// Pilot mode (mobile-first)
import PilotDashboard from './pages/pilot/Dashboard';
import PilotChecklistDetail from './pages/pilot/ChecklistDetail';

// Ground operations (desktop-first)
import GroundDashboard from './pages/ground/Dashboard';
import GroundAircraft from './pages/ground/Aircraft';
import GroundAircraftForm from './pages/ground/AircraftForm';
import GroundChecklists from './pages/ground/Checklists';
import GroundChecklistForm from './pages/ground/ChecklistForm';
import GroundChecklistDetail from './pages/ground/ChecklistDetail';

import ProtectedRoute from './components/auth/ProtectedRoute';

function AppContent() {
  useDarkMode(); // Apply dark mode globally

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* PILOT MODE - Mobile-first */}
      <Route
        path="/pilot"
        element={
          <ProtectedRoute>
            <PilotDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pilot/checklists/:id"
        element={
          <ProtectedRoute>
            <PilotChecklistDetail />
          </ProtectedRoute>
        }
      />

      {/* GROUND OPERATIONS - Desktop-first */}
      <Route
        path="/ground"
        element={
          <ProtectedRoute>
            <GroundDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ground/aircraft"
        element={
          <ProtectedRoute>
            <GroundAircraft />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ground/aircraft/create"
        element={
          <ProtectedRoute>
            <GroundAircraftForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ground/aircraft/:id/edit"
        element={
          <ProtectedRoute>
            <GroundAircraftForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ground/checklists"
        element={
          <ProtectedRoute>
            <GroundChecklists />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ground/checklists/create"
        element={
          <ProtectedRoute>
            <GroundChecklistForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ground/checklists/:id/edit"
        element={
          <ProtectedRoute>
            <GroundChecklistForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ground/checklists/:id"
        element={
          <ProtectedRoute>
            <GroundChecklistDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ground/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* SHARED - Execution (used by both modes) */}
      <Route
        path="/executions/:id"
        element={
          <ProtectedRoute>
            <ChecklistExecution />
          </ProtectedRoute>
        }
      />

      {/* Legacy redirects for backwards compatibility */}
      <Route path="/dashboard" element={<Navigate to="/ground" replace />} />
      <Route path="/aircraft" element={<Navigate to="/ground/aircraft" replace />} />
      <Route path="/aircraft/*" element={<Navigate to="/ground/aircraft" replace />} />
      <Route path="/checklists" element={<Navigate to="/ground/checklists" replace />} />
      <Route path="/checklists/*" element={<Navigate to="/ground/checklists" replace />} />
      <Route path="/settings" element={<Navigate to="/ground/settings" replace />} />

      {/* Default redirect - will be replaced with device detection */}
      <Route path="/" element={<Navigate to="/pilot" replace />} />

      {/* 404 - redirect to pilot */}
      <Route path="*" element={<Navigate to="/pilot" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>

      {/* React Query Devtools - only in development */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;
