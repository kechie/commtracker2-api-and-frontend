import React, { useState } from 'react';
import { Container, Alert, Form, Button, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/useAuth'; // Import useAuth

// Function to parse JWT token
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}
const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const submitHandler = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await login(username, password); // your API call that returns the whole object

      // Option A: Get role directly from decoded token
      const decoded = parseJwt(response.token);
      const role = decoded?.role?.toLowerCase();

      if (!role) {
        throw new Error('Could not determine user role');
      }

      // Role-based redirect
      switch (role) {
        case 'receiving':
          navigate('/trackers', { replace: true });
          break;
        case 'admin':
        case 'superadmin':
          navigate('/admin', { replace: true });
          break;
        case 'recipient':
          navigate('/recipient-dashboard', { replace: true });
          break;
        case 'monitor':
          navigate('/', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Container>
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>
        {error}
      </Alert>}

      <Row className="justify-content-md-center mt-5">
        <Col xs={12} md={6}>
          <h1 className="text-center mb-4">
            <FontAwesomeIcon icon={faSignInAlt} className="me-2" /> Sign In
          </h1>

          <Form onSubmit={submitHandler}>
            <Form.Group className="my-2" controlId="username">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="my-2" controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              className="mt-3 w-100"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Form>

          <Row className="py-3">
            <Col>
              New Customer? <Link to="/register">Register</Link>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginScreen;
