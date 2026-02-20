import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Table, Button, Row, Col, Alert, Modal, Form, Pagination } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faArrowLeft, faBell } from '@fortawesome/free-solid-svg-icons'; // Import faBell

import api from '../utils/api'; // Import sendNotificationToRecipient

const RecipientManagementScreen = () => {
  const navigate = useNavigate();
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // Add success state
  const [showAlert, setShowAlert] = useState(false);

  // Pagination and Search state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

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

  // Notification modal state
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [currentRecipientForNotification, setCurrentRecipientForNotification] = useState(null);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationLoading, setNotificationLoading] = useState(false);

  // Auto-close alert after 5 seconds
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000); // Clear success message after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchRecipients = async (pageNum = 1, pageLimit = 10, search = '') => {
    try {
      const { data } = await api.get(`/recipients?page=${pageNum}&limit=${pageLimit}&search=${search}`);
      setRecipients(Array.isArray(data.recipients) ? data.recipients : []);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
      setPage(pageNum);
      setLoading(false);
      //console.log('Fetched recipients:', data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch recipients');
      setRecipients([]);
      setShowAlert(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadRecipients = async () => {
      fetchRecipients(page, limit, searchTerm);
    }
    loadRecipients();
  }, [page, limit, searchTerm]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchRecipients(newPage, limit, searchTerm);
    }
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setLimit(newLimit);
    fetchRecipients(1, newLimit, searchTerm);
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setPage(1); // Reset to first page on new search
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    setPage(1);
  };

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this recipient?')) {
      try {
        await api.delete(`/recipients/${id}`);
        fetchRecipients(page, limit, searchTerm);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete recipient');
        setShowAlert(true);
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

  const handleNotifyClick = (recipient) => {
    setCurrentRecipientForNotification(recipient);
    setNotificationTitle('');
    setNotificationMessage('');
    setShowNotifyModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setShowCreateModal(false);
    setShowNotifyModal(false); // Reset notification modal state
    setCurrentRecipient(null);
    setCurrentRecipientForNotification(null); // Reset notification recipient
    setFormData({ recipientCode: '', recipientName: '', initial: '' });
    setCreateFormData({ recipientCode: '', recipientName: '', initial: '' });
    setNotificationTitle(''); // Reset notification form
    setNotificationMessage(''); // Reset notification form
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
      fetchRecipients(page, limit, searchTerm);
      handleModalClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update recipient');
      setShowAlert(true);
    }
  };

  const handleCreateRecipient = async () => {
    try {
      await api.post('/recipients', createFormData);
      fetchRecipients(1, limit, searchTerm);
      handleModalClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create recipient');
      setShowAlert(true);
    }
  };

  const handleSendNotification = async () => {
    if (!currentRecipientForNotification || !notificationTitle || !notificationMessage) {
      setError('Please provide a title and message for the notification.');
      setShowAlert(true);
      return;
    }
    setNotificationLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await sendNotificationToRecipient(currentRecipientForNotification.id, notificationTitle, notificationMessage);
      setSuccess(`Notification sent to ${currentRecipientForNotification.recipientName}!`);
      handleModalClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send notification.');
      setShowAlert(true);
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/admin');
  };
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
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
      <Row className="align-items-center">
        <Col md={6}>
          <h5>Department/Office/Agency (Doc/Comm Recipients)</h5>
        </Col>
        <Col md={3}>
           <Form onSubmit={handleSearchSubmit} className="d-flex">
            <Form.Control
              type="text"
              placeholder="Search recipients..."
              className="me-2"
              value={searchInput}
              onChange={handleSearchChange}
            />
            <Button type="submit" variant="outline-primary">Search</Button>
            {searchTerm && (
              <Button variant="outline-secondary" className="ms-2" onClick={handleClearSearch}>Clear</Button>
            )}
          </Form>
        </Col>
        <Col md={3} className="text-end">
          <Button className="my-3" onClick={() => setShowCreateModal(true)}>
            <FontAwesomeIcon icon={faPlus} /> New Recipient
          </Button>
        </Col>
      </Row>
      {showAlert && error && (
        <Alert variant="danger" dismissible onClose={() => setShowAlert(false)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      <Table striped bordered hover responsive className="table-sm">
        <thead>
          <tr>
            <th>ID</th>
            <th>RECIPIENT CODE</th>
            <th>RECIPIENT NAME</th>
            <th>INITIAL</th>
            <th>Actions</th> {/* Updated to "Actions" */}
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
                <Button
                  variant="light"
                  className="btn-sm mx-1"
                  onClick={() => handleEditClick(recipient)}
                  title="Edit recipient"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </Button>
                <Button
                  variant="info"
                  className="btn-sm mx-1"
                  onClick={() => handleNotifyClick(recipient)}
                  title="Send Notification to Recipient Users"
                >
                  <FontAwesomeIcon icon={faBell} />
                </Button>
{/*                <Button
                  variant="danger"
                  className="btn-sm mx-1"
                  onClick={() => deleteHandler(recipient.id)}
                  title="Delete recipient"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button> */}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Pagination Controls */}
      <Row className="align-items-center my-3">
        <Col md={4}>
          <Form.Group className="d-flex align-items-center">
            <Form.Label className="me-2 mb-0">Items per page:</Form.Label>
            <Form.Select style={{ width: '80px' }} value={limit} onChange={handleLimitChange}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4} className="text-center">
          <span className="text-muted">
            Page {page} of {totalPages} (Total: {total} recipients)
          </span>
        </Col>
        <Col md={4} className="d-flex justify-content-end">
          <Pagination className="mb-0">
            <Pagination.First onClick={() => handlePageChange(1)} disabled={page === 1} />
            <Pagination.Prev onClick={() => handlePageChange(page - 1)} disabled={page === 1} />
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <Pagination.Ellipsis disabled />}
                  <Pagination.Item active={p === page} onClick={() => handlePageChange(p)}>
                    {p}
                  </Pagination.Item>
                </React.Fragment>
              ))}
            <Pagination.Next onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} />
            <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={page === totalPages} />
          </Pagination>
        </Col>
      </Row>

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

      {/* Notify Modal */}
      <Modal show={showNotifyModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Send Notification to {currentRecipientForNotification?.recipientName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="notificationTitle">
              <Form.Label>Notification Title</Form.Label>
              <Form.Control
                type="text"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder="Enter notification title"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="notificationMessage">
              <Form.Label>Notification Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Enter notification message"
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose} disabled={notificationLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSendNotification} disabled={notificationLoading}>
            {notificationLoading ? 'Sending...' : 'Send Notification'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default RecipientManagementScreen;
