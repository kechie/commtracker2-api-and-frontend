//frontend/src/screens/RecipientDashboardScreen.jsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Badge, Pagination } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { getRecipientTrackers, updateRecipientTrackerStatus } from '../utils/api';
import { useAuth } from '../context/useAuth';

const RecipientDashboardScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [recipientTrackers, setRecipientTrackers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTracker, setEditingTracker] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecipientTrackers, setTotalRecipientTrackers] = useState(0);
  const [sortBy, setSortBy] = useState('dateReceived');
  const [sortOrder, setSortOrder] = useState('DESC');
  const recipientId = 'd1fa2117-6b3b-4667-af6d-0d28a483bcac'; // Replace with actual recipient ID from auth context
  useEffect(() => {
    // Simulate data fetching
    setSortBy('createdAt')
    setSortOrder('DESC')
    setCurrentPage(10)

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null); // Clear previous success message
        const recipientTrackersData = await getRecipientTrackers(recipientId);
        console.log('Fetched recipient trackers data:', recipientTrackersData);
        const { data, pagination } = recipientTrackersData;
        setRecipientTrackers(data);
        setTotalRecipientTrackers(pagination.total);
        setTotalPages(pagination.totalPages);
        // Process and set data as needed
        // Simulate API call delay
        //await new Promise((resolve) => setTimeout(resolve, 1000));

        // Simulate success
        //setSuccess('Data loaded successfully!');
      } catch (err) {
        setError('Failed to load data.', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

      {/* Add recipient-specific content here */}
      {/* Analytics endpoint is TODO. Brief analytics, recent activities will be displayed here using Card component*/}

      {loading && <p>Loading data...</p>}
      {error && <p className="text-danger">Error: {error}</p>}
      {success && <p className="text-success">Success: {success}</p>}
      <p>Welcome to the Recipient Dashboard! Here you can track documents assigned to you and view or update their statuses.</p>
    </Container >
  );
}

export default RecipientDashboardScreen;