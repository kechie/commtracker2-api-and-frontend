// frontend/src/screens/AdminScreen.jsx
//import React from 'react';
import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft} from '@fortawesome/free-solid-svg-icons';
import { Table, Button, Modal, Form, Row,Col } from 'react-bootstrap';
import { getActivityLogs } from '../utils/api';
import { useNavigate } from 'react-router-dom';
const ActivityLogsDashboardScreen = () => {
  const { user, role } = useAuth();
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getActivityLogs();
        console.log('Fetched activity logs:', data);
        setLogs(data.data);
        console.log('Activity logs set in state:', data.logs);
      } catch (error) {
        console.error('Error fetching activity logs:', error);
      }
    };

    fetchLogs();
  }, []);

  const handleBack = () => navigate('/');

  return (
    <div>
      <h1>Activity Logs Dashboard</h1>
      <Row className="align-items-left mb-3">
        <Col>
          <Button
            variant="light"
            onClick={handleBack}
            className="d-flex align-items-center gap-2"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back
          </Button>
        </Col>
      </Row>
      <Table striped bordered hover responsive className="table-sm mt-3">
        <thead>
          <tr>
            <th>ID</th>
            <th>Entity Type</th>
            <th>Entity ID</th>
            <th>Action</th>
            <th>User</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{log.id}</td>
              <td>{log.entityType}</td>
              <td>{log.entityId}</td>
              <td>{log.action}</td>
              <td>{log.user ? log.user.username : 'N/A'}</td>
              <td>{new Date(log.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>

    </div>
  );
};

export default ActivityLogsDashboardScreen;