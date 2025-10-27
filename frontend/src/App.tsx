import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { useDarkMode } from './hooks/useDarkMode';
import './lib/i18n'; // Initialize i18n

import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import Aircraft from './pages/Aircraft';
import AircraftForm from './pages/AircraftForm';
import Checklists from './pages/Checklists';
import ChecklistForm from './pages/ChecklistForm';
import ChecklistDetail from './pages/ChecklistDetail';
import ChecklistExecution from './pages/ChecklistExecution';
import Settings from './pages/Settings';
import ProtectedRoute from './components/auth/ProtectedRoute';

function AppContent() {
  useDarkMode(); // Apply dark mode globally

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Aircraft routes */}
      <Route
        path="/aircraft"
        element={
          <ProtectedRoute>
            <Aircraft />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aircraft/create"
        element={
          <ProtectedRoute>
            <AircraftForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aircraft/:id/edit"
        element={
          <ProtectedRoute>
            <AircraftForm />
          </ProtectedRoute>
        }
      />

      {/* Checklist routes */}
      <Route
        path="/checklists"
        element={
          <ProtectedRoute>
            <Checklists />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checklists/create"
        element={
          <ProtectedRoute>
            <ChecklistForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checklists/:id/edit"
        element={
          <ProtectedRoute>
            <ChecklistForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checklists/:id"
        element={
          <ProtectedRoute>
            <ChecklistDetail />
          </ProtectedRoute>
        }
      />

      {/* Execution routes */}
      <Route
        path="/executions/:id"
        element={
          <ProtectedRoute>
            <ChecklistExecution />
          </ProtectedRoute>
        }
      />

      {/* Settings route */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
