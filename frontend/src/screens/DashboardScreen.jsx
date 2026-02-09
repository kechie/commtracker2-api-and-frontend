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
        <Col>
          <h1>Main Dashboard</h1>
          {user && (
            <p>Hello, {user.userId},{role}!</p>
          )}<br />
          {role === 'receiving' && <Link to="/trackers">Manage Document Tracking</Link>}<br />
          {role === 'receiving' && <Link to="/receiving-dashboard">Receiving Dashboard</Link>}<br />
          {/*(role === 'receiving' &&
            <Container className="mt-4">
              Add receiving-specific content here
              Analytics, recent activities, quick actions, etc.
              link to tracker management screen
            </Container>*/}
          {(role === 'admin' || role === 'superadmin') && <Link to="/admin">Admin Panel</Link>}<br />
          {/*(role === 'admin' || role === 'superadmin') &&
            <Container className="mt-4">
              Add admin -specific content here
              recent activities, quick actions, etc.
              link to tracker management screen
            </Container>*/}
          {role === 'recipient' && <Link to="/recipient-dashboard">Your DocTrkr2s</Link>}<br />
          {/*role === 'recipient' &&
            <Container className="mt-4">
              Add recipient-specific content here
              brief analytics, recent activities, quick actions, etc.
            </Container>*/}
          {/*role === 'monitor' &&
            <Container className="mt-4">
              Add monitor-specific content here
              brief analytics, recent activities, quick actions, etc.
            </Container>*/}
          <p>This will contain analytics for the monitor and recipient role in the future.</p>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardScreen;
