import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartBar,
  faList,
  faFileAlt,
  faUsers,
  faArrowRight,
  faHistory,
  faBuilding
} from '@fortawesome/free-solid-svg-icons';
import { getSystemAnalytics, getActivityLogs, getTrackers } from '../utils/api';

const MonitorDashboardScreen = () => {
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [recentTrackers, setRecentTrackers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, logsData, trackersData] = await Promise.all([
          getSystemAnalytics(),
          getActivityLogs(1, 5, 'createdAt', 'DESC'),
          getTrackers(1, 5, 'dateReceived', 'DESC')
        ]);
        setStats(statsData);
        setRecentLogs(logsData.data || []);
        setRecentTrackers(trackersData.data || trackersData || []);
      } catch (err) {
        console.error('Error fetching monitor data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <Spinner animation="border" variant="primary" />
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

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Monitor Dashboard</h1>
        <div className="text-muted">
          Real-time system overview
        </div>
      </div>

      {/* Quick Stats Overview */}
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="text-center shadow-sm border-0 border-top border-4 border-primary h-100">
            <Card.Body>
              <div className="text-primary mb-2">
                <FontAwesomeIcon icon={faFileAlt} size="2x" />
              </div>
              <Card.Title className="text-muted small text-uppercase fw-bold">Total Trackers</Card.Title>
              <h2 className="fw-bold mb-0">{stats?.counts?.trackers || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm border-0 border-top border-4 border-success h-100">
            <Card.Body>
              <div className="text-success mb-2">
                <FontAwesomeIcon icon={faBuilding} size="2x" />
              </div>
              <Card.Title className="text-muted small text-uppercase fw-bold">Total Recipients</Card.Title>
              <h2 className="fw-bold mb-0">{stats?.counts?.recipients || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm border-0 border-top border-4 border-info h-100">
            <Card.Body>
              <div className="text-info mb-2">
                <FontAwesomeIcon icon={faUsers} size="2x" />
              </div>
              <Card.Title className="text-muted small text-uppercase fw-bold">Active Users</Card.Title>
              <h2 className="fw-bold mb-0">{stats?.counts?.users || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm border-0 border-top border-4 border-warning h-100">
            <Card.Body>
              <div className="text-warning mb-2">
                <FontAwesomeIcon icon={faHistory} size="2x" />
              </div>
              <Card.Title className="text-muted small text-uppercase fw-bold">Recent Logs</Card.Title>
              <h2 className="fw-bold mb-0">{recentLogs.length}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Main Content: Recent Activity */}
        <Col lg={8}>
          <Card className="shadow-sm mb-4 border-0">
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
              <h5 className="mb-0 fw-bold">
                <FontAwesomeIcon icon={faList} className="me-2 text-primary" />
                Recent Activity
              </h5>
              <Link to="/activity-logs-dashboard" className="btn btn-sm btn-outline-primary rounded-pill">
                View All Logs <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
              </Link>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-3">Type</th>
                    <th>Action</th>
                    <th>User</th>
                    <th className="text-end pe-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map(log => (
                    <tr key={log.id}>
                      <td className="ps-3">
                        <span className="badge bg-light text-dark border">{log.entityType}</span>
                      </td>
                      <td>{log.action}</td>
                      <td>
                        <div className="fw-bold text-primary">{log.user?.username || 'System'}</div>
                      </td>
                      <td className="text-end pe-3 text-muted small">
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })}
                      </td>
                    </tr>
                  ))}
                  {recentLogs.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-muted">No recent activity found.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* New Trackers Table (Read-Only) */}
          <Card className="shadow-sm mb-4 border-0">
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
              <h5 className="mb-0 fw-bold">
                <FontAwesomeIcon icon={faFileAlt} className="me-2 text-primary" />
                Latest Trackers
              </h5>
              <Link to="/trackers" className="btn btn-sm btn-outline-primary rounded-pill">
                View All Trackers <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
              </Link>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-3">Serial No.</th>
                    <th>Document Title</th>
                    <th>From</th>
                    <th className="text-center">Status Summary</th>
                    <th className="text-end pe-3">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrackers.map(tracker => {
                    const trs = tracker.trackerRecipients || [];
                    const statusCounts = {
                      pending: trs.filter(tr => tr.status === 'pending').length,
                      seen: trs.filter(tr => tr.status === 'seen').length,
                      read: trs.filter(tr => tr.status === 'read').length,
                      acknowledged: trs.filter(tr => tr.status === 'acknowledged').length,
                      completed: trs.filter(tr => tr.status === 'completed').length,
                    };

                    return (
                      <tr key={tracker.id}>
                        <td className="ps-3 fw-bold small text-muted">{tracker.serialNumber}</td>
                        <td className="small">{tracker.documentTitle}</td>
                        <td className="small">{tracker.fromName}</td>
                        <td className="text-center">
                          <div className="d-flex gap-1 justify-content-center flex-wrap">
                            {statusCounts.pending > 0 && <Badge bg="secondary" pill>{statusCounts.pending}P</Badge>}
                            {statusCounts.seen > 0 && <Badge bg="info" pill>{statusCounts.seen}S</Badge>}
                            {statusCounts.completed > 0 && <Badge bg="success" pill>{statusCounts.completed}C</Badge>}
                          </div>
                        </td>
                        <td className="text-end pe-3 small text-muted">
                          {new Date(tracker.dateReceived).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                  {recentTrackers.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">No trackers found.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* System Performance Summary */}
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white py-3 border-bottom">
              <h5 className="mb-0 fw-bold">
                <FontAwesomeIcon icon={faChartBar} className="me-2 text-success" />
                System Performance
              </h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">
                Analyze document flow, processing times, and user engagement across the system.
              </p>
              <Row className="text-center g-3 mb-3">
                <Col sm={4}>
                  <div className="p-3 bg-light rounded shadow-sm">
                    <div className="small text-muted">Avg. Time to Seen</div>
                    <div className="h4 fw-bold mb-0">{stats?.avgStageDurations?.avgPendingHours || '0'}h</div>
                  </div>
                </Col>
                <Col sm={4}>
                  <div className="p-3 bg-light rounded shadow-sm">
                    <div className="small text-muted">Avg. Processing</div>
                    <div className="h4 fw-bold mb-0">{stats?.avgStageDurations?.avgProcessingHours || '0'}h</div>
                  </div>
                </Col>
                <Col sm={4}>
                  <div className="p-3 bg-light rounded shadow-sm">
                    <div className="small text-muted">Total Cycle</div>
                    <div className="h4 fw-bold mb-0">{stats?.avgStageDurations?.avgTotalCompletionHours || '0'}h</div>
                  </div>
                </Col>
              </Row>
              <div className="d-grid">
                <Button variant="success" onClick={() => navigate('/analytics')}>
                  Explore Comprehensive Analytics
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Sidebar: Status and Quick Links */}
        <Col lg={4}>
          <Card className="shadow-sm mb-4 border-0">
            <Card.Header className="bg-white py-3 border-bottom">
              <h5 className="mb-0 fw-bold">Tracker Status Distribution</h5>
            </Card.Header>
            <Card.Body>
              {stats?.trackersByStatus && stats.trackersByStatus.length > 0 ? (
                <div className="status-list">
                  {stats.trackersByStatus.map(s => {
                    let bgColor = 'bg-secondary';
                    if (s.status === 'completed') bgColor = 'bg-success';
                    if (s.status === 'pending') bgColor = 'bg-warning';
                    if (s.status === 'seen' || s.status === 'read') bgColor = 'bg-info';
                    if (s.status === 'rejected') bgColor = 'bg-danger';

                    return (
                      <div key={s.status} className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center">
                          <span className={`badge rounded-circle me-2 p-1 ${bgColor}`} style={{ width: '10px', height: '10px' }}> </span>
                          <span className="text-capitalize">{s.status}</span>
                        </div>
                        <span className="fw-bold">{s.count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted py-3">No status data available.</div>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white py-3 border-bottom">
              <h5 className="mb-0 fw-bold">Quick Navigation</h5>
            </Card.Header>
            <Card.Body className="p-2">
              <div className="list-group list-group-flush">
                <button
                  onClick={() => navigate('/trackers')}
                  className="list-group-item list-group-item-action border-0 d-flex align-items-center py-3"
                >
                  <FontAwesomeIcon icon={faFileAlt} className="me-3 text-primary" />
                  Manage Documents
                </button>
                <button
                  onClick={() => navigate('/activity-logs-dashboard')}
                  className="list-group-item list-group-item-action border-0 d-flex align-items-center py-3"
                >
                  <FontAwesomeIcon icon={faList} className="me-3 text-info" />
                  Audit Logs
                </button>
                <button
                  onClick={() => navigate('/analytics')}
                  className="list-group-item list-group-item-action border-0 d-flex align-items-center py-3"
                >
                  <FontAwesomeIcon icon={faChartBar} className="me-3 text-success" />
                  System Statistics
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="list-group-item list-group-item-action border-0 d-flex align-items-center py-3"
                >
                  <FontAwesomeIcon icon={faUsers} className="me-3 text-warning" />
                  Your Profile
                </button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MonitorDashboardScreen;
