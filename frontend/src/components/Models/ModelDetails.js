import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getModel, updateModel, deleteModel, getUniqueUsers, getMethodHistory } from '../../services/api';
import ReportBrowser from '../Reports/ReportBrowser';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CancelIcon from '@mui/icons-material/Cancel';
import PeopleIcon from '@mui/icons-material/People';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ModelDetails = () => {
  const [model, setModel] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [uniqueUsers, setUniqueUsers] = useState(0);
  const [methodHistory, setMethodHistory] = useState([]);
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState(new Date());
  const { name } = useParams();
  const navigate = useNavigate();

  const fetchModel = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getModel(name);
      setModel(data);
      const users = await getUniqueUsers(name);
      setUniqueUsers(users);
      const history = await getMethodHistory(name, startDate, endDate);
      setMethodHistory(history);
      setError('');
    } catch (err) {
      setError('Failed to fetch model details');
    } finally {
      setLoading(false);
    }
  }, [name, startDate, endDate]);

  useEffect(() => {
    fetchModel();
  }, [fetchModel]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updatedModel = await updateModel(model.name, model);
      setModel(updatedModel);
      setEditing(false);
      setError('');
    } catch (err) {
      setError('Failed to update model');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteModel(name);
      navigate('/models');
    } catch (err) {
      setError('Failed to delete model');
    }
  };

  const handleDateChange = async () => {
    try {
      const history = await getMethodHistory(name, startDate, endDate);
      setMethodHistory(history);
    } catch (err) {
      setError('Failed to fetch method history');
    }
  };

  const formatChartData = (data) => {
    const allDates = data.reduce((dates, method) => {
      method.history.forEach(item => dates.add(item.date));
      return dates;
    }, new Set());

    const sortedDates = Array.from(allDates).sort();

    return sortedDates.map(date => {
      const dataPoint = { date };
      data.forEach(method => {
        const historyItem = method.history.find(item => item.date === date);
        dataPoint[method.method] = historyItem ? historyItem.count : 0;
      });
      return dataPoint;
    });
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;
  if (!model) return <Typography>Model not found</Typography>;

  const chartData = formatChartData(methodHistory);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Card elevation={3} sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/')}
              sx={{ mr: 2 }}
            >
              Go Back
            </Button>
            <Typography variant="h4" component="h1">
              Model Details
            </Typography>
            <Chip label={`Created: ${new Date(model.created_at).toLocaleString()}`} color="primary" />
          </Box>
          {editing ? (
            <form onSubmit={handleUpdate}>
              <TextField
                fullWidth
                label="Model Name"
                variant="outlined"
                value={model.name}
                onChange={(e) => setModel({ ...model, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                >
                  Save
                </Button>
                <Button
                  onClick={() => setEditing(false)}
                  variant="outlined"
                  startIcon={<CancelIcon />}
                >
                  Cancel
                </Button>
              </Box>
            </form>
          ) : (
            <Box>
              <Typography variant="h5" sx={{ mb: 2 }}>{model.name}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ mr: 1 }} />
                <Typography variant="body1">
                  Unique Users: {uniqueUsers}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <IconButton onClick={() => setEditing(true)} color="primary" aria-label="edit">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => setOpenDeleteDialog(true)} color="error" aria-label="delete">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card elevation={3} sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>Method Usage History</Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={4}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  onClick={handleDateChange}
                  fullWidth
                  sx={{ height: '100%' }}
                >
                  Update Graph
                </Button>
              </Grid>
            </Grid>
          </LocalizationProvider>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {methodHistory.map((method, index) => (
                <Line
                  key={method.method}
                  type="monotone"
                  dataKey={method.method}
                  stroke={`#${Math.floor(Math.random()*16777215).toString(16)}`}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <ReportBrowser modelName={model.name} />

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Delete Model"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this model? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ModelDetails;