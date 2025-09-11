import React from 'react';
import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { CircularProgress, Box } from '@material-ui/core';

// Context Providers
import { Web3Provider } from './contexts/Web3Context';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import Header from './Containers/Header';
import Home from './Components/Home';
import Register from './Components/Register';
import Login from './Components/Login';
import Dashboard from './Components/Dashboard';
import GovtLogin from './Components/Govt_Login';
import RegistrationForm from './Containers/RegistrationForm';
import DashboardGovt from './Components/Dashboard_Govt';
import Profile from './Components/Profile';
import Help from './Components/Help';

// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#328888',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, requireGovernment = false }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requireGovernment && user?.role !== 'government') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Main App Component
function AppContent() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/govt_login" element={<GovtLogin />} />
          <Route path="/guide" element={<Help />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/registration_form"
            element={
              <ProtectedRoute>
                <RegistrationForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard_govt" 
            element={
              <ProtectedRoute requireGovernment={true}>
                <DashboardGovt />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

// Main App Component with Providers
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Web3Provider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;
