//frontend/src/screens/RecipientDashboardScreen.jsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Badge, Pagination } from 'react-bootstrap';

const RecipientDashboardScreen = () => {
  const navigate = useNavigate();
  const handleBack = () => {
    //navigate(-1);
    navigate('/');
  }
  return (
    <Container>
      <h1>Recipient Dashboard</h1>
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

      {/* <p>This is a dashboard specifically for users with the 'recipient' role.</p>
      Add recipient-specific content here */}
      {/* Brief analytics, recent activities, quick actions, etc. */}
      {/* Placeholder content */}
      <p>Welcome to the Recipient Dashboard! Here you can track documents assigned to you and view or update their statuses.</p>
    </Container >
  );
}

export default RecipientDashboardScreen;