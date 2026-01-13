import React from 'react';
import { Container, Row, Col, Table, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

// Mock data until API is connected
const trackers = [
  {
    id: 1,
    serialNumber: 'DOC-2024-001',
    documentTitle: 'Annual Budget Proposal',
    fromName: 'Finance Department',
    dateReceived: '2024-07-01',
    status: 'pending',
  },
  {
    id: 2,
    serialNumber: 'DOC-2024-002',
    documentTitle: 'New Office Lease Agreement',
    fromName: 'Admin Office',
    dateReceived: '2024-07-05',
    status: 'approved',
  },
    {
    id: 3,
    serialNumber: 'DOC-2024-003',
    documentTitle: 'Project Phoenix Kick-off',
    fromName: 'R&D Department',
    dateReceived: '2024-07-10',
    status: 'for review',
  },
];

const DashboardScreen = () => {
  return (
    <Container fluid>
      <Row className="align-items-center my-4">
        <Col>
          <h1>Dashboard</h1>
        </Col>
        <Col className="text-end">
          <Button variant="primary">
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            New Document
          </Button>
        </Col>
      </Row>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Serial Number</th>
            <th>Document Title</th>
            <th>Origin</th>
            <th>Date Received</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {trackers.map((tracker) => (
            <tr key={tracker.id}>
              <td>{tracker.serialNumber}</td>
              <td>{tracker.documentTitle}</td>
              <td>{tracker.fromName}</td>
              <td>{new Date(tracker.dateReceived).toLocaleDateString()}</td>
              <td>
                <span className={`badge bg-${tracker.status === 'approved' ? 'success' : tracker.status === 'pending' ? 'warning' : 'info'}`}>
                  {tracker.status.charAt(0).toUpperCase() + tracker.status.slice(1)}
                </span>
              </td>
              <td>
                <Button variant="info" size="sm" className="me-2">
                    <FontAwesomeIcon icon={faEye} />
                </Button>
                <Button variant="warning" size="sm" className="me-2">
                    <FontAwesomeIcon icon={faEdit} />
                </Button>
                <Button variant="danger" size="sm">
                    <FontAwesomeIcon icon={faTrash} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default DashboardScreen;
