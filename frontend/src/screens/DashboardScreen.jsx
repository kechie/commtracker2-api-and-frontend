import React from 'react';
import { Container, Row, Col, Table, Button } from 'react-bootstrap';
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faPlus, faEye, faEdit, faTrash, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
//import { useNavigate, Link } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';


const DashboardScreen = () => {
  const { user, role } = useAuth();
  /*   const navigate = useNavigate();
    const handleBack = () => {
      navigate('/');
      //window.location.href = '/';
    } */
  //console.log('User info in DashboardScreen:', user, role);
  return (
    <Container>
      <Row className="align-items-left mb-3">
        <Col><h1>Main Dashboard</h1></Col>
        {user && (
          <p>Hello, {user.userId},{role}!</p>
        )}
        <Link to="/trackers">Manage Document Tracking</Link>
        <br />
        <Link to="/receiving-dashboard">Receiving Dashboard</Link>
        {/* <p>This will contain analytics and user-specific content.</p> */}

        {/* Add receiving-specific content here
      Analytics, recent activities, quick actions, etc.
      link to tracker management screen
      */}
        {/*         <Col>
          <h1>Dashboard</h1>
        </Col>
        <Col className="text-end">
          <Button variant="primary">
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            New Document
          </Button>
        </Col> */}
      </Row>
    </Container>
  );
};

export default DashboardScreen;
