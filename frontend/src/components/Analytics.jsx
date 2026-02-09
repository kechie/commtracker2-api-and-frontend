import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Table } from 'react-bootstrap';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { getSystemAnalytics, getActivitySummary } from '../utils/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const Analytics = () => {
  const [systemStats, setSystemStats] = useState(null);
  const [activitySummary, setActivitySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, summaryData] = await Promise.all([
          getSystemAnalytics(),
          getActivitySummary()
        ]);
        setSystemStats(statsData);
        setActivitySummary(summaryData.summary);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!systemStats || !activitySummary) return null;

  // Transform Data for System Stats
  const userRoleData = systemStats.usersByRole.map(item => ({
    name: item.role,
    value: parseInt(item.count, 10)
  }));

  const trackerStatusData = systemStats.trackersByStatus.map(item => ({
    name: item.status,
    value: parseInt(item.count, 10)
  }));

  const recentTrackersData = systemStats.recentTrackers.map(item => ({
    name: new Date(item.month).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
    count: parseInt(item.count, 10)
  }));

  // Transform Data for Tracker Actions
  const trackerActionData = systemStats.trackersByAction ? systemStats.trackersByAction.map(item => ({
    name: item.action || 'Unknown',
    value: parseInt(item.count, 10)
  })) : [];

  // Transform Data for Activity Logs (Existing)
  const actionData = activitySummary.byAction.map(item => ({
    name: item.action,
    value: parseInt(item.count, 10)
  }));

  // Transform Data for Average Durations
  const durationData = systemStats.avgStageDurations ? [
    { name: 'Pending to Seen', hours: parseFloat(systemStats.avgStageDurations.avgPendingHours || 0) },
    { name: 'Seen to Complete', hours: parseFloat(systemStats.avgStageDurations.avgProcessingHours || 0) },
    { name: 'Total Cycle Time', hours: parseFloat(systemStats.avgStageDurations.avgTotalCompletionHours || 0) }
  ] : [];

  return (
    <Container className="mt-4">
      <h2 className="mb-4">System Analytics & Insights</h2>

      {/* Key Metrics Cards */}
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="text-center shadow-sm h-100 border-primary border-top-0 border-end-0 border-bottom-0 border-4">
            <Card.Body>
              <Card.Title className="text-muted">Total Users</Card.Title>
              <h3 className="display-6 fw-bold text-primary">{systemStats.counts.users}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm h-100 border-success border-top-0 border-end-0 border-bottom-0 border-4">
            <Card.Body>
              <Card.Title className="text-muted">Total Trackers</Card.Title>
              <h3 className="display-6 fw-bold text-success">{systemStats.counts.trackers}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm h-100 border-warning border-top-0 border-end-0 border-bottom-0 border-4">
            <Card.Body>
              <Card.Title className="text-muted">Total Recipients</Card.Title>
              <h3 className="display-6 fw-bold text-warning">{systemStats.counts.recipients}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm h-100 border-info border-top-0 border-end-0 border-bottom-0 border-4">
            <Card.Body>
              <Card.Title className="text-muted">Total Activities</Card.Title>
              <h3 className="display-6 fw-bold text-info">{activitySummary.totalActivities}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Row 1: Users & Tracker Status */}
      <Row className="mb-4">
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white fw-bold">User Distribution by Role</Card.Header>
            <Card.Body style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userRoleData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Users" fill="#8884d8">
                    {userRoleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white fw-bold">Tracker Status Distribution</Card.Header>
            <Card.Body style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trackerStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#82ca9d"
                    dataKey="value"
                  >
                    {trackerStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Row 2: Recent Activity Trend & Top Recipients */}
      <Row className="mb-4">
        <Col lg={8} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white fw-bold">New Trackers (Last 6 Months)</Card.Header>
            <Card.Body style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recentTrackersData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" name="New Trackers" stroke="#8884d8" activeDot={{ r: 8 }} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white fw-bold">Top 10 Busy Recipients</Card.Header>
            <Card.Body className="p-0 overflow-auto" style={{ maxHeight: '300px' }}>
              <Table hover striped className="mb-0 text-center">
                <thead className="table-light sticky-top">
                  <tr>
                    <th>Recipient</th>
                    <th>Code</th>
                    <th>Docs</th>
                  </tr>
                </thead>
                <tbody>
                  {systemStats.topRecipients.length > 0 ? (
                    systemStats.topRecipients.map((recipient, index) => (
                      <tr key={index}>
                        <td className="text-start ps-3">{recipient.name}</td>
                        <td>{recipient.code}</td>
                        <td><span className="badge bg-primary rounded-pill">{recipient.count}</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-muted py-4">No data available</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Row 3: Recipient Actions & System Activity */}
      <Row className="mb-4">
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white fw-bold">Recipient Actions on Documents</Card.Header>
            <Card.Body style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trackerActionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Count" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white fw-bold">System Activity Log Summary</Card.Header>
            <Card.Body style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Occurrences" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Row 4: Average Stage Durations */}
      <Row>
        <Col md={12}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white fw-bold">Average Tracker Duration by Stage (Hours)</Card.Header>
            <Card.Body style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={durationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value} hours`, 'Duration']} />
                  <Legend />
                  <Bar dataKey="hours" name="Avg Duration (Hours)" fill="#8884d8" barSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Analytics;