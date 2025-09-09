import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';
import Web3 from 'web3';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

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

// Context for Web3 and authentication
const Web3Context = createContext();
const AuthContext = createContext();

export const useWeb3 = () => useContext(Web3Context);
export const useAuth = () => useContext(AuthContext);

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

function App() {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Web3 and authentication
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await loadWeb3();
      await checkAuthentication();
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeb3 = async () => {
    try {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          localStorage.setItem('web3account', accounts[0]);
        }

        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            localStorage.setItem('web3account', accounts[0]);
          } else {
            setAccount(null);
            localStorage.removeItem('web3account');
            setIsAuthenticated(false);
            setUser(null);
          }
        });

        // Listen for network changes
        window.ethereum.on('chainChanged', () => {
          window.location.reload();
        });

    } else if (window.web3) {
        const web3Instance = new Web3(window.web3.currentProvider);
        setWeb3(web3Instance);
        const accounts = await web3Instance.eth.getAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          localStorage.setItem('web3account', accounts[0]);
        }
    } else {
        console.warn('No Ethereum provider detected. Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error loading Web3:', error);
    }
  };

  const checkAuthentication = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  };

  const login = (userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('web3account');
  };

  const web3ContextValue = {
    web3,
    account,
    loadWeb3,
  };

  const authContextValue = {
    isAuthenticated,
    user,
    login,
    logout,
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Web3Context.Provider value={web3ContextValue}>
        <AuthContext.Provider value={authContextValue}>
      <Router>
          <div className="App">
              <Header />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signup" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route 
                  path="/dashboard" 
                  element={
                    isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
                  } 
                />
                <Route path="/govt_login" element={<GovtLogin />} />
                <Route 
                  path="/profile" 
                  element={
                    isAuthenticated ? <Profile /> : <Navigate to="/login" />
                  } 
                />
            <Route
              path="/registration_form"
                  element={
                    isAuthenticated ? <RegistrationForm /> : <Navigate to="/login" />
                  } 
                />
                <Route 
                  path="/dashboard_govt" 
                  element={
                    isAuthenticated && user?.role === 'government' ? 
                    <DashboardGovt /> : <Navigate to="/login" />
                  } 
                />
                <Route path="/guide" element={<Help />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
          </div>
      </Router>
        </AuthContext.Provider>
      </Web3Context.Provider>
    </ThemeProvider>
  );
}

export default App;
