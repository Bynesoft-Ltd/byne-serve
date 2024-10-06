import React from 'react';
import { Route, Routes, Navigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ModelList from './components/Models/ModelList';
import ModelForm from './components/Models/ModelForm';
import ModelDetails from './components/Models/ModelDetails';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  CssBaseline,
} from '@mui/material';

function App() {
  const { isAuthenticated, loading, logout } = useAuth();

  const handleLogout = () => {
    logout();
    // Redirect to login page after logout
    <Navigate to="/login" replace />;
  };

  if (loading) {
    return <div>Loading...</div>; // or a spinner component
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
            <Typography variant="h4" component="span" sx={{ fontWeight: 'bold', mr: 2 }}>
              Ⓑ
            </Typography>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              byne-serve
            </Typography>
          </RouterLink>
          <Box sx={{ flexGrow: 1 }} />
          {isAuthenticated && (
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
          <Route
            path="/"
            element={isAuthenticated ? <ModelList /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/models/new"
            element={isAuthenticated ? <ModelForm /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/models/:name"
            element={isAuthenticated ? <ModelDetails /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;