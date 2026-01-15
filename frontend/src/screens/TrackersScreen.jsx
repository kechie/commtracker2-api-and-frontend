import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import { getTrackers, createTracker, updateTracker, deleteTracker, getRecipients } from '../utils/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

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
    recipientIds: [], // Changed to an array
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [trackersData, recipientsData] = await Promise.all([getTrackers(), getRecipients()]);
        setTrackers(trackersData);
        setRecipients(recipientsData);
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
      setFormData({
        serialNumber: tracker.serialNumber || '',
        fromName: tracker.fromName || '',
        documentTitle: tracker.documentTitle || '',
        dateReceived: tracker.dateReceived ? new Date(tracker.dateReceived).toISOString().split('T')[0] : '',
        isConfidential: tracker.isConfidential || false,
        recipientIds: tracker.recipients ? tracker.recipients.map(r => r.id) : [],
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

  return (
    <>
      <h1>Document Trackers</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      <Button variant="primary" className="mb-3" onClick={() => handleShow()}>
        <FontAwesomeIcon icon={faPlus} className="me-2" />New Doc Tracker
      </Button>

      {loading ? (
        <p>Loading trackers...</p>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Serial Number</th>
              <th>Document Title</th>
              <th>From</th>
              <th>Recipients</th>
              <th>Date Received</th>
              <th>Confidential</th>
              <th>Is Seen?</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trackers.map((tracker) => (
              <tr key={tracker.id}>
                <td>{tracker.serialNumber}</td>
                <td>{tracker.documentTitle}</td>
                <td>{tracker.fromName}</td>
                <td>{tracker.recipients.map(r => r.recipientName).join(', ')}</td>
                <td>{new Date(tracker.dateReceived).toLocaleDateString()}</td>
                <td>{tracker.isConfidential ? 'Yes' : 'No'}</td>
                <td>{tracker.isSeen ? 'Yes' : 'No'}</td>
                <td>
                  <Button variant="light" size="sm" onClick={() => handleShow(tracker)}>
                    <FontAwesomeIcon icon={faEdit} />
                  </Button>
                  <Button variant="danger" size="sm" className="ms-2" onClick={() => handleDelete(tracker.id)}>
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </td>
              </tr>
            ))}
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
              <Form.Check type="checkbox" name="isConfidential" label="Confidential" checked={formData.isConfidential} onChange={handleChange} />
            </Form.Group>
            <Button variant="primary" type="submit">
              {editingTracker ? 'Update' : 'Create'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default TrackersScreen;
