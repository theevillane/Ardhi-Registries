import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@material-ui/core';
import {
  Menu as MenuIcon,
  AccountCircle,
  Dashboard,
  Home,
  Login,
  PersonAdd,
  ExitToApp,
  AdminPanelSettings,
} from '@material-ui/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { isAuthenticated, user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    handleMenuClose();
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { label: 'Home', path: '/', icon: <Home /> },
    { label: 'Guide', path: '/guide', icon: <Dashboard /> },
  ];

  const authMenuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
    { label: 'Profile', path: '/profile', icon: <AccountCircle /> },
    { label: 'Register Land', path: '/registration_form', icon: <PersonAdd /> },
  ];

  const govtMenuItems = [
    { label: 'Government Dashboard', path: '/dashboard_govt', icon: <AdminPanelSettings /> },
  ];

  const renderDesktopMenu = () => (
    <Box display="flex" alignItems="center" gap={2}>
      {menuItems.map((item) => (
        <Button
          key={item.path}
          color="inherit"
          onClick={() => handleNavigation(item.path)}
          style={{
            backgroundColor: isActive(item.path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          }}
        >
          {item.label}
        </Button>
      ))}

      {isAuthenticated ? (
        <>
          {authMenuItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              onClick={() => handleNavigation(item.path)}
              style={{
                backgroundColor: isActive(item.path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              }}
            >
              {item.label}
            </Button>
          ))}

          {user?.role === 'government' && govtMenuItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              onClick={() => handleNavigation(item.path)}
              style={{
                backgroundColor: isActive(item.path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              }}
            >
              {item.label}
            </Button>
          ))}

          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            aria-label="account menu"
          >
            <Avatar style={{ width: 32, height: 32, backgroundColor: theme.palette.secondary.main }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => handleNavigation('/profile')}>
              <ListItemIcon>
                <AccountCircle />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <ExitToApp />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </>
      ) : (
        <>
          <Button
            color="inherit"
            onClick={() => handleNavigation('/login')}
            startIcon={<Login />}
          >
            Login
          </Button>
          <Button
            color="inherit"
            onClick={() => handleNavigation('/signup')}
            startIcon={<PersonAdd />}
            variant="outlined"
            style={{ marginLeft: 8 }}
          >
            Sign Up
          </Button>
        </>
      )}
    </Box>
  );

  const renderMobileMenu = () => (
    <Drawer
      anchor="right"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
    >
      <Box width={250} padding={2}>
        <Typography variant="h6" gutterBottom>
          Menu
        </Typography>
        
        <List>
          {menuItems.map((item) => (
            <ListItem
              key={item.path}
              button
              onClick={() => handleNavigation(item.path)}
              selected={isActive(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}

          {isAuthenticated ? (
            <>
              {authMenuItems.map((item) => (
                <ListItem
                  key={item.path}
                  button
                  onClick={() => handleNavigation(item.path)}
                  selected={isActive(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItem>
              ))}

              {user?.role === 'government' && govtMenuItems.map((item) => (
                <ListItem
                  key={item.path}
                  button
                  onClick={() => handleNavigation(item.path)}
                  selected={isActive(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItem>
              ))}

              <ListItem button onClick={handleLogout}>
                <ListItemIcon>
                  <ExitToApp />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItem>
            </>
          ) : (
            <>
              <ListItem button onClick={() => handleNavigation('/login')}>
                <ListItemIcon>
                  <Login />
                </ListItemIcon>
                <ListItemText primary="Login" />
              </ListItem>
              <ListItem button onClick={() => handleNavigation('/signup')}>
                <ListItemIcon>
                  <PersonAdd />
                </ListItemIcon>
                <ListItemText primary="Sign Up" />
              </ListItem>
            </>
          )}
        </List>
      </Box>
    </Drawer>
  );

  return (
    <>
      <AppBar position="static" style={{ backgroundColor: '#328888' }}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            🏠 Ardhi Registries
          </Typography>

          {isMobile ? (
            <IconButton
              color="inherit"
              onClick={() => setMobileMenuOpen(true)}
              edge="end"
            >
              <MenuIcon />
            </IconButton>
          ) : (
            renderDesktopMenu()
          )}
        </Toolbar>
      </AppBar>

      {isMobile && renderMobileMenu()}
    </>
  );
}

export default Header;