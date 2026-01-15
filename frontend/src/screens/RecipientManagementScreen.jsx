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
    name: '',
    address: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
  });

  const [createFormData, setCreateFormData] = useState({
    name: '',
    address: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
  });

  const fetchRecipients = async () => {
    try {
      const { data: { recipients } } = await api.get('/recipients');
      setRecipients(recipients);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch recipients');
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchRecipients();
    })();
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
      name: recipient.name,
      address: recipient.address,
      contactPerson: recipient.contactPerson,
      contactEmail: recipient.contactEmail,
      contactPhone: recipient.contactPhone,
    });
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setShowCreateModal(false);
    setCurrentRecipient(null);
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
            <th>NAME</th>
            <th>ADDRESS</th>
            <th>CONTACT PERSON</th>
            <th>CONTACT EMAIL</th>
            <th>CONTACT PHONE</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {recipients.map((recipient) => (
            <tr key={recipient.id}>
              <td>{recipient.id}</td>
              <td>{recipient.name}</td>
              <td>{recipient.address}</td>
              <td>{recipient.contactPerson}</td>
              <td>{recipient.contactEmail}</td>
              <td>{recipient.contactPhone}</td>
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
       <Modal show={showEditModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Recipient</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formAddress">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={formData.address}
                onChange={handleFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formContactPerson">
              <Form.Label>Contact Person</Form.Label>
              <Form.Control
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formContactEmail">
              <Form.Label>Contact Email</Form.Label>
              <Form.Control
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formContactPhone">
              <Form.Label>Contact Phone</Form.Label>
              <Form.Control
                type="text"
                name="contactPhone"
                value={formData.contactPhone}
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
      {/* Create Recipient Modal */}
      <Modal show={showCreateModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Create Recipient</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
          <Form.Group className="mb-3" controlId="formCreateName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={createFormData.name}
                onChange={handleCreateFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formCreateAddress">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={createFormData.address}
                onChange={handleCreateFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formCreateContactPerson">
              <Form.Label>Contact Person</Form.Label>
              <Form.Control
                type="text"
                name="contactPerson"
                value={createFormData.contactPerson}
                onChange={handleCreateFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formCreateContactEmail">
              <Form.Label>Contact Email</Form.Label>
              <Form.Control
                type="email"
                name="contactEmail"
                value={createFormData.contactEmail}
                onChange={handleCreateFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formCreateContactPhone">
              <Form.Label>Contact Phone</Form.Label>
              <Form.Control
                type="text"
                name="contactPhone"
                value={createFormData.contactPhone}
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
