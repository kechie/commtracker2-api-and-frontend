import React from 'react';
import { Container, Row, Col, Table, Button } from 'react-bootstrap';
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faPlus, faEye, faEdit, faTrash, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
//import { useNavigate, Link } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Analytics from '../components/Analytics';


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
          {/* <h1>Main Dashboard</h1>
          {user && (
            <p>Hello, {user.fullname || user.userId}, {role}!</p>
          )}<br />*/}

          {['monitor', 'admin', 'superadmin'].includes(role) && (
            <div className="mt-4">
              <Analytics />
            </div>
          )}
        </Col>
      </Row>
      <Row>
        {role === 'receiving' && <Link to="/trackers">Manage Document Tracking</Link>}<br />
        {role === 'receiving' && <Link to="/receiving-dashboard">Receiving Dashboard</Link>}<br />
        {(role === 'admin' || role === 'superadmin') && <Link to="/admin">Admin Panel</Link>}<br />
        {role === 'recipient' && <Link to="/recipient-dashboard">Recipient Dashboard</Link>}<br />
        {role === 'lcestaff' && <Link to="/lcestaff-dashboard">LCE Staff Dashboard</Link>}<br />
        {role === 'lce' && <Link to="/lce-dashboard">LCE Dashboard</Link>}<br />
        {role === 'monitor' && <Link to="/activity-logs-dashboard">Activity Logs Dashboard</Link>}<br />
      </Row>
    </Container>
  );
};

export default DashboardScreen;
