import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Row, Col, Alert, Modal, Form, Pagination } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const UserManagementScreen = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAlert, setShowAlert] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    role: '',
  });

  const [createFormData, setCreateFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullname: '',
    userrole: 'user',
  });

  // Auto-close alert after 5 seconds
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  const fetchUsers = async (targetPage, targetLimit) => {
    setLoading(true);

    try {
      const { data } = await api.get(`/users?page=${targetPage}&limit=${targetLimit}`);

      // Batch updates - React 18+ will batch them anyway, but it's clearer
      setUsers(data.users);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users');
      setShowAlert(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUsers = async () => {
      fetchUsers(page, limit);
    };
    loadUsers();
  }, [page, limit]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setLimit(newLimit);
    setPage(1);
  };

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers(page, limit);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete user');
        setShowAlert(true);
      }
    }
  };

  const handleEditClick = (user) => {
    setCurrentUser(user);
    setFormData({
      username: user.username,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
    });
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setShowCreateModal(false);
    setCurrentUser(null);
    setCreateFormData({
      username: '',
      password: '',
      email: '',
      fullname: '',
      userrole: 'user',
    });
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateFormChange = (e) => {
    setCreateFormData({ ...createFormData, [e.target.name]: e.target.value });
  };

  const handleSaveChanges = async () => {
    try {
      // Send only updatable fields
      const updateData = {
        fullname: formData.fullname,
        email: formData.email,
        role: formData.role
      };
      await api.put(`/users/${currentUser.id}`, updateData);
      fetchUsers(page, limit);
      handleModalClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
      setShowAlert(true);
    }
  };

  const handleCreateUser = async () => {
    try {
      await api.post('/auth/register', createFormData);
      fetchUsers(1, limit);
      handleModalClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
      setShowAlert(true);
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
        <Col>
          <h5>Doc Tracker User Accounts</h5>
        </Col>
        <Col className="text-end">
          <Button className="my-3" onClick={() => setShowCreateModal(true)}>
            <i className="fas fa-plus"></i> <FontAwesomeIcon icon={faPlus} /> Create User Account
          </Button>
        </Col>
      </Row>
      {showAlert && error && (
        <Alert variant="danger" dismissible onClose={() => setShowAlert(false)}>
          {error}
        </Alert>
      )}
      <Table striped bordered hover responsive className="table-sm">
        <thead>
          <tr>
            {/* <th>ID</th> */}
            <th>Username</th>
            <th>Department/Office/Agency</th>
            <th>Email</th>
            <th>Role</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              {/* <td>{user.id}</td> */}
              <td>{user.username}</td>
              <td>{user.recipient?.recipientName || 'N/A'}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <Button variant="light" className="btn-sm mx-1" onClick={() => handleEditClick(user)}>
                  <i className="fas fa-edit"></i>
                  <FontAwesomeIcon icon={faEdit} />
                </Button>
                <Button
                  variant="danger"
                  className="btn-sm mx-1"
                  onClick={() => deleteHandler(user.id)}
                >
                  <i className="fas fa-trash"></i>
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
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
            Page {page} of {totalPages} (Total: {total} users)
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

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleFormChange}
                disabled
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formFullname">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                name="fullname"
                value={formData.fullname}
                onChange={handleFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formRole">
              <Form.Label>Role</Form.Label>
              <Form.Control
                as="select"
                name="role"
                value={formData.role}
                onChange={handleFormChange}
              >
                <option value="user">User/Receiving</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
                <option value="viewer">Viewer</option>
                <option value="monitor">Monitor</option>
                <option value="staff">Staff</option>
                {/*superadmin', 'admin', 'receiving', 'recipient', 'viewer', 'monitor', 'staff' */}
              </Form.Control>
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

      {/* Create User Modal */}
      <Modal show={showCreateModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Create User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formCreateUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={createFormData.username}
                onChange={handleCreateFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formCreatePassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={createFormData.password}
                onChange={handleCreateFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formCreateFullname">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                name="fullname"
                value={createFormData.fullname}
                onChange={handleCreateFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formCreateEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={createFormData.email}
                onChange={handleCreateFormChange}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formCreateRole">
              <Form.Label>Role</Form.Label>
              <Form.Control
                as="select"
                name="userrole"
                value={createFormData.userrole}
                onChange={handleCreateFormChange}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
                <option value="staff">Staff</option>
              </Form.Control>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleCreateUser}>
            Create User
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserManagementScreen;