import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createModel } from '../../services/api';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';

const ModelForm = () => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createModel({ name });
      navigate('/');
    } catch (err) {
      setError('Failed to create model');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Card elevation={3}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton
              onClick={() => navigate('/')}
              sx={{ mr: 2 }}
              aria-label="go back"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              Create New Model
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              id="name"
              label="Model Name"
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              fullWidth
            >
              Create Model
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ModelForm;