import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Row, Col, Alert, Modal, Form } from 'react-bootstrap';
import api from '../utils/api';

const RecipientManagementScreen = () => {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentRecipient, setCurrentRecipient] = useState(null);
  const [formData, setFormData] = useState({
    recipientCode: '',
    recipientName: '',
    initial: '',
  });

  const [createFormData, setCreateFormData] = useState({
    recipientCode: '',
    recipientName: '',
    initial: '',
  });

  const fetchRecipients = async () => {
    try {
      const { data: { recipients } } = await api.get('/recipients');
      setRecipients(Array.isArray(recipients) ? recipients : []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch recipients');
      setRecipients([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
  }, []);

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this recipient?')) {
      try {
        await api.delete(`/recipients/${id}`);
        fetchRecipients();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete recipient');
      }
    }
  };

  const handleEditClick = (recipient) => {
    setCurrentRecipient(recipient);
    setFormData({
      id: recipient.id,
      recipientCode: recipient.recipientCode,
      recipientName: recipient.recipientName,
      initial: recipient.initial || '',
    });
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setShowCreateModal(false);
    setCurrentRecipient(null);
    setFormData({ recipientCode: '', recipientName: '', initial: '' });
    setCreateFormData({ recipientCode: '', recipientName: '', initial: '' });
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateFormChange = (e) => {
    setCreateFormData({ ...createFormData, [e.target.name]: e.target.value });
  };

  const handleSaveChanges = async () => {
    try {
      await api.put(`/recipients/${currentRecipient.id}`, formData);
      fetchRecipients();
      handleModalClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update recipient');
    }
  };

  const handleCreateRecipient = async () => {
    try {
      await api.post('/recipients', createFormData);
      fetchRecipients();
      handleModalClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create recipient');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <Row className="align-items-center">
        <Col>
          <h1>Recipients</h1>
        </Col>
        <Col className="text-end">
          <Button className="my-3" onClick={() => setShowCreateModal(true)}>
            <i className="fas fa-plus"></i> Create Recipient
          </Button>
        </Col>
      </Row>
      {error && <Alert variant="danger">{error}</Alert>}
      <Table striped bordered hover responsive className="table-sm">
        <thead>
          <tr>
            <th>ID</th>
            <th>RECIPIENT CODE</th>
            <th>RECIPIENT NAME</th>
            <th>INITIAL</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {recipients.map((recipient) => (
            <tr key={recipient.id}>
              <td>{recipient.id}</td>
              <td>{recipient.recipientCode}</td>
              <td>{recipient.recipientName}</td>
              <td>{recipient.initial}</td>
              <td>
                <Button variant="light" className="btn-sm mx-1" onClick={() => handleEditClick(recipient)}>
                  <i className="fas fa-edit"></i>
                </Button>
                <Button
                  variant="danger"
                  className="btn-sm mx-1"
                  onClick={() => deleteHandler(recipient.id)}
                >
                  <i className="fas fa-trash"></i>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Recipient</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formRecipientCode">
              <Form.Label>Recipient Code</Form.Label>
              <Form.Control
                type="text"
                name="recipientCode"
                value={formData.recipientCode}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formRecipientName">
              <Form.Label>Recipient Name</Form.Label>
              <Form.Control
                type="text"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formInitial">
              <Form.Label>Initial</Form.Label>
              <Form.Control
                type="text"
                name="initial"
                value={formData.initial}
                onChange={handleFormChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Create Modal */}
      <Modal show={showCreateModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Create Recipient</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formCreateRecipientCode">
              <Form.Label>Recipient Code</Form.Label>
              <Form.Control
                type="text"
                name="recipientCode"
                value={createFormData.recipientCode}
                onChange={handleCreateFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formCreateRecipientName">
              <Form.Label>Recipient Name</Form.Label>
              <Form.Control
                type="text"
                name="recipientName"
                value={createFormData.recipientName}
                onChange={handleCreateFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formCreateInitial">
              <Form.Label>Initial</Form.Label>
              <Form.Control
                type="text"
                name="initial"
                value={createFormData.initial}
                onChange={handleCreateFormChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleCreateRecipient}>
            Create Recipient
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default RecipientManagementScreen;