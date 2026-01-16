//frontend/src/screens/ReceivingDashboardScreen.jsx
//import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';

const ReceivingDashboardScreen = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const handleBack = () => {
    //navigate(-1);
    navigate('/');
  }
  return (
    <Container >
      <h1>Receiving Dashboard</h1>
      {/*user && (
        <p>Welcome, {user.username}! Your role is: {role}</p>
      )*/}
      {/*<p>This is a dashboard specifically for users with the 'receiving' role.</p>
       Add receiving-specific content here
      Analytics, recent activities, quick actions, etc.
      */}
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
      <Link to="/trackers">Manage Document Trackers</Link>
      <br />
      <p>This will contain receiving-specific analytics</p>
    </Container>
  );
};

export default ReceivingDashboardScreen;