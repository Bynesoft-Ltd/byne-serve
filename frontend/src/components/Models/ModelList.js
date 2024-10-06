import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getModels, deleteModel } from '../../services/api';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const ModelList = () => {
  const [models, setModels] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [modelToDelete, setModelToDelete] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchModels();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const data = await getModels();
      setModels(data);
    } catch (err) {
      console.error('Failed to fetch models:', err);
      setError('Failed to fetch models');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (model) => {
    setModelToDelete(model);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteModel(modelToDelete.name);
      setModels(models.filter(model => model.name !== modelToDelete.name));
      setOpenDeleteDialog(false);
    } catch (err) {
      console.error('Failed to delete model:', err);
      setError('Failed to delete model');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Card elevation={3}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Models
            </Typography>
            {isAuthenticated && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                component={Link}
                to="/models/new"
              >
                Create New Model
              </Button>
            )}
          </Box>

          {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

          {!isAuthenticated && <Typography>Please log in to view models.</Typography>}

          {isAuthenticated && models.length === 0 && <Typography>No models found.</Typography>}

          {isAuthenticated && models.length > 0 && (
            <List>
              {models.map(model => (
                <ListItem
                  key={model.id}
                  button
                  onClick={() => navigate(`/models/${model.name}`)}
                  sx={{
                    borderBottom: '1px solid #e0e0e0',
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  <ListItemText
                    primary={model.name}
                    secondary={
                      <Chip
                        label={`Created: ${new Date(model.created_at).toLocaleDateString()}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(model);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Delete Model"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete the model "{modelToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ModelList;