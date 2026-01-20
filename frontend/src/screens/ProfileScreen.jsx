import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';
import { useAuth } from '../context/useAuth';
import api from '../utils/api';

const ProfileScreen = () => {
  const { user, loading: authLoading } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.userId) {
        try {
          const { data } = await api.get(`/users/profile`);
          setFullname(data.fullname || '');
          setEmail(data.email || '');
          setLoading(false);
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to fetch profile');
          setLoading(false);
        }
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [user, authLoading]);

  const handleEdit = () => {
    setIsEditing(true);
    setMessage(null);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPassword('');
    setConfirmPassword('');
    setMessage(null);
    setError(null);
    // Optionally re-fetch original data if needed
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    setMessage(null);

    try {
      const payload = { fullname, email };
      if (password) {
        payload.password = password;
      }

      await api.put(`/users/profile`, payload);

      setMessage('Profile updated successfully!');
      setIsEditing(false);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  if (loading || authLoading) {
    return <div className="text-center mt-5">Loading profile...</div>;
  }

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col xs={12} md={8} lg={6}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">User Profile</h4>
            </Card.Header>

            <Card.Body>
              {message && <Alert variant="success" dismissible>{message}</Alert>}
              {error && <Alert variant="danger" dismissible>{error}</Alert>}

              <Form onSubmit={submitHandler}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  {isEditing ? (
                    <Form.Control
                      type="text"
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      required
                    />
                  ) : (
                    <div className="form-control-plaintext fw-bold">{fullname || '—'}</div>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  {isEditing ? (
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  ) : (
                    <div className="form-control-plaintext">{email || '—'}</div>
                  )}
                </Form.Group>

                {isEditing && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>New Password (optional)</Form.Label>
                      <Form.Control
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </Form.Group>
                  </>
                )}

                <div className="d-flex gap-2 mt-4">
                  {!isEditing ? (
                    <Button variant="primary" onClick={handleEdit}>
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button type="submit" variant="success">
                        Save Changes
                      </Button>
                      <Button variant="outline-secondary" onClick={handleCancel}>
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfileScreen;
/* import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useAuth } from '../context/useAuth';
import api from '../utils/api';

const ProfileScreen = () => {
  const { user, loading: authLoading } = useAuth();
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.userId) {
        try {
          const { data } = await api.get(`/users/profile`); // Assuming a /api/v2/users/profile endpoint
          setFullname(data.fullname || '');
          setEmail(data.email || '');
          setLoading(false);
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to fetch profile');
          setLoading(false);
        }
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [user, authLoading]);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const payload = { fullname, email };
      if (password) {
        payload.password = password;
      }
      const { data } = await api.put(`/users/profile`, payload); // Assuming a PUT /api/v2/users/profile endpoint
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  if (loading || authLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <Row className="justify-content-md-center mt-5">
        <Col xs={12} md={6}>
          <h2>User Profile</h2>
          {message && <Alert variant="success">{message}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={submitHandler}>
            <Form.Group className="my-2" controlId="fullname">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter full name"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
              ></Form.Control>
            </Form.Group>

            <Form.Group className="my-2" controlId="email">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              ></Form.Control>
            </Form.Group>

            <Form.Group className="my-2" controlId="password">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              ></Form.Control>
            </Form.Group>

            <Form.Group className="my-2" controlId="confirmPassword">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              ></Form.Control>
            </Form.Group>

            <Button type="submit" variant="primary" className="mt-3">
              Update
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfileScreen;
 */