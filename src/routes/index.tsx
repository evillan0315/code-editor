import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './AppLayout';
import EditorPageView from '@/components/editor/EditorPageView';
import Dashboard from './Dashboard';
import LoginForm from '@/components/auth/Login'; // Your LoginForm component
import RecordingManager from '@/components/recording/RecordingManager';
import AuthCallback from './AuthCallback'; // NEW: Import AuthCallback

// Import your custom route guards
import { ProtectedRoute } from '@/components/routing/ProtectedRoute'; // Assuming this path for ProtectedRoute
import { PublicOnlyRoute } from '@/components/routing/PublicOnlyRoute'; // NEW: Assuming PublicOnlyRoute is here too

// Import your centralized path constants
import {
  LOGIN_PATH,
  DASHBOARD_PATH,
  EDITOR_PATH,
  RECORDING_PATH, // Typically '/'
} from '@/constants/paths';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public-Only Routes:
          These routes are only accessible to unauthenticated users.
          If an authenticated user tries to access these, they will be redirected to DASHBOARD_PATH.
      */}
      <Route
        path={LOGIN_PATH} // Example: /login
        element={
          <PublicOnlyRoute>
            <LoginForm />
          </PublicOnlyRoute>
        }
      />
      {/* NEW: Auth Callback Route */}
      <Route path="/auth/callback" element={<AuthCallback />} />
      {/* Add other public-only routes here (e.g., registration, forgot password) */}
      {/* <Route path='/register' element={<PublicOnlyRoute><RegisterForm /></PublicOnlyRoute>} /> */}

      {/* Default/Index Route: Redirects to EDITOR_PATH */}
      <Route index element={<Navigate to={EDITOR_PATH} replace />} />

      {/* Protected Routes:
          Each protected route now explicitly renders the AppLayout and passes its content as children.
          This replaces the Outlet-based nesting from the previous structure.
      */}
      <Route
        path={EDITOR_PATH}
        element={
          <ProtectedRoute>
            <AppLayout>
              <EditorPageView />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={DASHBOARD_PATH}
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path={RECORDING_PATH}
        element={
          <ProtectedRoute>
            <AppLayout>
              <RecordingManager />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all Route: For any paths that don't match the defined routes above */}
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}
