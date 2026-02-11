import { Container } from 'react-bootstrap';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import DashboardScreen from './screens/DashboardScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import AdminScreen from './screens/AdminScreen';
import ProfileScreen from './screens/ProfileScreen';
import TrackersScreen from './screens/TrackersScreen';
import ReceivingDashboardScreen from './screens/ReceivingDashboardScreen'; // Import ReceivingDashboardScreen
import RecipientDashboardScreen from './screens/RecipientDashboardScreen';
import LceStaffDashboardScreen from './screens/LceStaffDashboardScreen';
import LceDashboardScreen from './screens/LceDashboardScreen';
import RecipientTrackerDetailsScreen from './screens/RecipientTrackerDetailsScreen';
import UserManagementScreen from './screens/UserManagementScreen'; // Import UserManagementScreen
import RecipientManagementScreen from './screens/RecipientManagementScreen';
import ActivityLogsDashboardScreen from './screens/ActivityLogsDashboardScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import CalendarScreen from './screens/CalendarScreen';
import PublicTrackingScreen from './screens/PublicTrackingScreen';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <AuthProvider>
      <Header />
      <main className="py-3">
        <Container>
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['monitor', 'receiving', 'admin', 'superadmin', 'recipient', 'lcestaff', 'lce']}>
                  <DashboardScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute allowedRoles={['recipient', 'admin', 'superadmin','monitor', 'lcestaff', 'lce']}>
                  <CalendarScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin', 'superadmin','monitor']}>
                  <AdminScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin', 'superadmin','monitor']}>
                  <AnalyticsScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trackers"
              element={
                <ProtectedRoute allowedRoles={['receiving', 'admin', 'superadmin']}>
                  <TrackersScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/receiving-dashboard"
              element={
                <ProtectedRoute allowedRoles={['receiving', 'admin', 'superadmin']}>
                  <ReceivingDashboardScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users-management"
              element={
                <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                  <UserManagementScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recipients-management"
              element={
                <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                  <RecipientManagementScreen />
                </ProtectedRoute>
              }
            />
            <Route path="/recipient-dashboard"
              element={
                <ProtectedRoute allowedRoles={['recipient', 'admin', 'superadmin']}>
                  <RecipientDashboardScreen />
                </ProtectedRoute>
              }
            />
            <Route path="/lcestaff-dashboard"
              element={
                <ProtectedRoute allowedRoles={['lcestaff', 'admin', 'superadmin']}>
                  <LceStaffDashboardScreen />
                </ProtectedRoute>
              }
            />
            <Route path="/lce-dashboard"
              element={
                <ProtectedRoute allowedRoles={['lce', 'admin', 'superadmin']}>
                  <LceDashboardScreen />
                </ProtectedRoute>
              }
            />
            <Route path="/recipients/:recipientId/trackers/:trackerId"
              element={<ProtectedRoute allowedRoles={['recipient', 'admin', 'superadmin', 'monitor', 'receiving', 'lcestaff', 'lce']}>
                <RecipientTrackerDetailsScreen />
              </ProtectedRoute>}
            />
            <Route path="/activity-logs-dashboard"
              element={
                <ProtectedRoute allowedRoles={['monitor', 'admin', 'superadmin']}>
                  <ActivityLogsDashboardScreen />
                </ProtectedRoute>
              }
            />
            {/* Public Routes */}
            <Route path="/public/tracking/:serialNumber" element={<PublicTrackingScreen />} />

            <Route path="*" element={<h2>404 - Page Not Found</h2>} />
          </Routes>
        </Container>
      </main>
      <Footer />
    </AuthProvider>
  );
};

export default App;
