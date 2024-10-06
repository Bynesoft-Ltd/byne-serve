import React, { useState, useEffect, useCallback } from 'react';
import { getReports, deleteReport } from '../../services/api';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  Select,
  MenuItem,
  Box,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  Container,
  Card,
  CardContent,
  IconButton,
  Pagination,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from '@mui/icons-material/Delete';

const ReportBrowser = ({ modelName }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [limit] = useState(10);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getReports(modelName, page, limit);
      // Assuming the response is an array of reports
      const newReports = Array.isArray(response) ? response : [];
      setReports(newReports);
      setHasMore(newReports.length === limit); // If we get less than the limit, assume there are no more pages
      setError(null);
    } catch (err) {
      setError('Failed to fetch reports');
      setReports([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [modelName, page, limit]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDelete = async (reportId) => {
    try {
      await deleteReport(reportId);
      fetchReports();
    } catch (err) {
      setError('Failed to delete report');
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const filteredReports = reports.filter(report => {
    const matchesText = report.method.toLowerCase().includes(filter.toLowerCase()) ||
                        report.machine_id.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    return matchesText && matchesStatus;
  });

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const renderEnvironmentInfo = (envInfo) => {
    if (!envInfo) return null;

    const sections = [
      { title: 'OS Info', data: envInfo.os_info },
      { title: 'Python Info', data: envInfo.python_info },
      { title: 'CUDA Info', data: envInfo.cuda_info },
      { title: 'GPU Info', data: envInfo.gpu_info },
    ];

    return (
      <Grid container spacing={2}>
        {sections.map((section, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>{section.title}</Typography>
              {section.data && typeof section.data === 'object' ? (
                <List dense>
                  {Object.entries(section.data).map(([key, value]) => (
                    <ListItem key={key}>
                      <ListItemText
                        primary={key.replace(/_/g, ' ')}
                        secondary={value.toString()}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2">{JSON.stringify(section.data)}</Typography>
              )}
            </Paper>
          </Grid>
        ))}
        {envInfo.installed_packages && (
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Installed Packages</Typography>
              <List dense>
                {envInfo.installed_packages.map((pkg, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={pkg} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  };

  if (loading && reports.length === 0) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Card elevation={3}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Reports for {modelName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
            <FilterListIcon color="action" />
            <TextField
              label="Filter reports"
              variant="outlined"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              size="small"
              sx={{ flexGrow: 1 }}
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="small"
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="fail">Fail</MenuItem>
            </Select>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ mt: 3 }}>
        {filteredReports.map(report => (
          <Accordion key={report.id} sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: report.status === 'success' ? 'success.light' : 'error.light',
                '&:hover': {
                  backgroundColor: report.status === 'success' ? 'success.main' : 'error.main',
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <Typography variant="subtitle1">{report.method}</Typography>
                <Box>
                  <Typography variant="caption" sx={{ mr: 1 }}>
                    {report.status}
                  </Typography>
                  <Typography variant="caption">{formatTimestamp(report.timestamp)}</Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                <strong>ID:</strong> {report.id}<br />
                <strong>Machine ID:</strong> {report.machine_id}
              </Typography>
              {report.error && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" color="error">Error:</Typography>
                  <Paper elevation={1} sx={{ p: 1, bgcolor: 'error.light' }}>
                    <Typography variant="body2">{report.error}</Typography>
                  </Paper>
                </Box>
              )}
              {report.traceback && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1">Traceback:</Typography>
                  <Paper elevation={1} sx={{ p: 1, bgcolor: 'grey.100' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontSize: '0.875rem' }}>
                      {report.traceback}
                    </pre>
                  </Paper>
                </Box>
              )}
              {report.env_info && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1">Environment Info:</Typography>
                  {renderEnvironmentInfo(report.env_info)}
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <IconButton
                  color="secondary"
                  onClick={() => handleDelete(report.id)}
                  size="small"
                  aria-label="delete"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Pagination
          count={page + (hasMore ? 1 : 0)}
          page={page}
          onChange={handlePageChange}
          color="primary"
          disabled={loading}
        />
      </Box>
    </Container>
  );
};

export default ReportBrowser;