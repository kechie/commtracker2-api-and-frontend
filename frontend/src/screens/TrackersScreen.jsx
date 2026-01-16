import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert, Container, Row, Col, Badge } from 'react-bootstrap';
import { getTrackers, createTracker, updateTracker, deleteTracker, getAllRecipients } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faArrowLeft, faEye } from '@fortawesome/free-solid-svg-icons';

const TrackersScreen = () => {
  const [trackers, setTrackers] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTracker, setEditingTracker] = useState(null);
  const [formData, setFormData] = useState({
    serialNumber: '',
    fromName: '',
    documentTitle: '',
    dateReceived: '',
    isConfidential: false,
    recipientIds: [], // Array of recipient IDs to assign
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [trackersData, recipientsData] = await Promise.all([getTrackers(), getAllRecipients()]);
        //console.log('Fetched trackers:', trackersData);
        //console.log('Fetched recipients:', recipientsData.recipients);
        setTrackers(trackersData);
        setRecipients(recipientsData.recipients);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const fetchTrackers = async () => {
    const data = await getTrackers();
    setTrackers(data);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingTracker(null);
    setFormData({
      serialNumber: '',
      fromName: '',
      documentTitle: '',
      dateReceived: '',
      isConfidential: false,
      recipientIds: [],
    });
  };

  const handleShow = (tracker = null) => {
    if (tracker) {
      setEditingTracker(tracker);
      // Extract recipient IDs from trackerRecipients array
      const recipientIds = tracker.trackerRecipients
        ? tracker.trackerRecipients.map(tr => tr.recipientId)
        : [];
      setFormData({
        serialNumber: tracker.serialNumber || '',
        fromName: tracker.fromName || '',
        documentTitle: tracker.documentTitle || '',
        dateReceived: tracker.dateReceived ? new Date(tracker.dateReceived).toISOString().split('T')[0] : '',
        isConfidential: tracker.isConfidential || false,
        recipientIds: recipientIds,
      });
    }
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked, options } = e.target;
    if (name === 'recipientIds') {
      const selectedIds = Array.from(options).filter(option => option.selected).map(option => option.value);
      setFormData(prev => ({ ...prev, recipientIds: selectedIds }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTracker) {
        await updateTracker(editingTracker.id, formData);
      } else {
        await createTracker(formData);
      }
      fetchTrackers();
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to save tracker');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tracker?')) {
      try {
        await deleteTracker(id);
        fetchTrackers();
      } catch (err) {
        setError(err.message || 'Failed to delete tracker');
      }
    }
  };
  const navigate = useNavigate();
  const handleBack = () => {
    navigate('/receiving-dashboard');
  }
  return (
    <Container>
      {/*console.log('Rendering TrackersScreen with trackers:', trackers)*/}
      {/*console.log('Recipients available:', recipients.recipients)*/}
      <Row><h1>Document Trackers</h1></Row>
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
      {error && <Alert variant="danger">{error}</Alert>}
      <Row>
        <Button variant="primary" className="mb-3" onClick={() => handleShow()}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />New Doc Tracker
        </Button>
      </Row>
      {loading ? (
        <p>Loading trackers...</p>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Serial Number</th>
              <th>Document Title</th>
              <th>From</th>
              <th>Recipients & Status</th>
              <th>Date Received</th>
              <th>Confidential</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trackers.map((tracker) => {
              // Get recipient info from trackerRecipients
              const trackerRecipients = tracker.trackerRecipients || [];
              const recipientNames = trackerRecipients
                .map(tr => tr.recipient?.recipientName)
                .filter(Boolean)
                .join(', ');

              // Count recipients by status
              const statusCounts = {
                pending: trackerRecipients.filter(tr => tr.status === 'pending').length,
                seen: trackerRecipients.filter(tr => tr.status === 'seen').length,
                read: trackerRecipients.filter(tr => tr.status === 'read').length,
                acknowledged: trackerRecipients.filter(tr => tr.status === 'acknowledged').length,
                completed: trackerRecipients.filter(tr => tr.status === 'completed').length,
              };

              return (
                <tr key={tracker.id}>
                  <td>{tracker.serialNumber}</td>
                  <td>{tracker.documentTitle}</td>
                  <td>{tracker.fromName}</td>
                  <td>
                    <div className="mb-2">
                      <small className="text-muted d-block">{recipientNames}</small>
                    </div>
                    <div className="d-flex gap-1 flex-wrap">
                      {statusCounts.pending > 0 && (
                        <Badge bg="secondary">Pending: {statusCounts.pending}</Badge>
                      )}
                      {statusCounts.seen > 0 && (
                        <Badge bg="info">Seen: {statusCounts.seen}</Badge>
                      )}
                      {statusCounts.read > 0 && (
                        <Badge bg="primary">Read: {statusCounts.read}</Badge>
                      )}
                      {statusCounts.acknowledged > 0 && (
                        <Badge bg="warning">Ack: {statusCounts.acknowledged}</Badge>
                      )}
                      {statusCounts.completed > 0 && (
                        <Badge bg="success">Done: {statusCounts.completed}</Badge>
                      )}
                    </div>
                  </td>
                  <td>{new Date(tracker.dateReceived).toLocaleDateString()}</td>
                  <td>{tracker.isConfidential ? 'Yes' : 'No'}</td>
                  <td>
                    <Button variant="light" size="sm" onClick={() => handleShow(tracker)} title="Edit">
                      <FontAwesomeIcon icon={faEdit} />
                    </Button>
                    <Button variant="light" size="sm" className="ms-2" title="View Details">
                      <FontAwesomeIcon icon={faEye} />
                    </Button>
                    {/* <Button variant="danger" size="sm" className="ms-2" onClick={() => handleDelete(tracker.id)} disabled={tracker.isSeen}> */}
                    <Button variant="danger" size="sm" className="ms-2" onClick={() => handleDelete(tracker.id)} disabled title="Delete">
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{editingTracker ? 'Edit' : 'Create'} Tracker</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="serialNumber">
              <Form.Label>Serial Number</Form.Label>
              <Form.Control
                type="text"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                readOnly={!editingTracker} // Make read-only for new trackers
                placeholder={editingTracker ? '' : 'Auto-generated on creation'}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="documentTitle">
              <Form.Label>Document Title</Form.Label>
              <Form.Control type="text" name="documentTitle" value={formData.documentTitle} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="fromName">
              <Form.Label>From</Form.Label>
              <Form.Control type="text" name="fromName" value={formData.fromName} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="dateReceived">
              <Form.Label>Date Received</Form.Label>
              <Form.Control type="date" name="dateReceived" value={formData.dateReceived} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="recipientIds">
              <Form.Label>Recipients</Form.Label>
              <Form.Control as="select" multiple name="recipientIds" value={formData.recipientIds} onChange={handleChange}>
                {recipients && Array.isArray(recipients) && recipients.map(r => (
                  <option key={r.id} value={r.id}>{r.recipientName}</option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-3" controlId="isConfidential">
              <Form.Check type="switch" name="isConfidential" label="Confidential" checked={formData.isConfidential} onChange={handleChange} />
            </Form.Group>
            <Button variant="primary" type="submit">
              {editingTracker ? 'Update' : 'Create'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default TrackersScreen;
