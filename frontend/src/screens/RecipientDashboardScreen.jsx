//frontend/src/screens/RecipientDashboardScreen.jsx
// Recipient Dashboard Screen
// This screen displays recipient-specific information and actions.
// It allows recipients to view documents assigned to them and track their statuses.
// It also provides analytics related to the recipient's activities.

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Badge, Pagination } from 'react-bootstrap';
import { use, useEffect, useState } from 'react';
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
  const recipientId = useAuth().user.recipientId; // Get recipient ID from auth context
  //const recipientId = useAuth().user.recipientId; // Get recipient ID from auth context
  //console.log('Recipient ID in RecipientDashboardScreen:', useAuth().user.recipientId);
  //console.log('email in RecipientDashboardScreen:', useAuth().user.email);
  //console.log('role ID in RecipientDashboardScreen:', useAuth().user.role);
  //console.log('Recipient ID in RecipientDashboardScreen:', useAuth().user.fullname);
  //console.log('Recipient ID in RecipientDashboardScreen:', useAuth().user.username);
  //console.log('Recipient ID in RecipientDashboardScreen (recipientId variable):', recipientId);

  useEffect(() => {
    setSortBy('createdAt')
    setSortOrder('DESC')
    setCurrentPage(1)
    setPageSize(10)

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null); // Clear previous error
        setSuccess(null); // Clear previous success message
        const recipientTrackersData = await getRecipientTrackers(recipientId);

        const { data, pagination } = recipientTrackersData;
        // Handle pagination metadata if present
        if (recipientTrackersData.pagination) {
          setTotalPages(recipientTrackersData.pagination.totalPages);
          setTotalRecipientTrackers(recipientTrackersData.pagination.total);
        } else {
          // Fallback for non-paginated response
          const totalCount = Array.isArray(data) ? data.length : 0;
          setTotalPages(1);
          setTotalRecipientTrackers(totalCount);
        }
        setRecipientTrackers(data);
        console.log('Fetched recipient trackers data:', recipientTrackersData);
        setTotalRecipientTrackers(pagination.total);
        setTotalPages(pagination.totalPages);
      } catch (err) {
        setError('Failed to load data.', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [recipientId]);

  const navigate = useNavigate();
  const handleBack = () => {
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
      {error && <p className="text-danger">Error: {error}</p>}
      {success && <p className="text-success">Success: {success}</p>}
      {loading ? (<p>Loading data...</p>) : (
        <p>Welcome to the Recipient Dashboard! Here you can track documents assigned to you and view or update their statuses.</p>
      )}
      {/* Recipient Trackers List with Pagination */}
      {totalPages > 1 && (
        <Row className="mt-4 mb-4 align-items-center">
          <Col md={6}>
            <Form.Group className="d-flex align-items-center gap-2">
              <Form.Label className="mb-0">Items per page:</Form.Label>
              <Form.Select
                style={{ width: 'auto' }}
                value={pageSize.toString()}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6} className="text-end">
            <small className="text-muted">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalRecipientTrackers)} of {totalRecipientTrackers}
              {/* trackers per recipient */}
            </small>
          </Col>
        </Row>
      )}

      {totalPages > 1 && (
        <Row className="mb-4">
          <Col>
            <Pagination className="justify-content-center">
              <Pagination.First
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              />
              <Pagination.Prev
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              />

              {/* Show page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage > totalPages - 3) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Pagination.Item
                    key={pageNum}
                    active={pageNum === currentPage}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Pagination.Item>
                );
              })}

              <Pagination.Next
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              />
              <Pagination.Last
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </Col>
        </Row>
      )}
    </Container >
  );
}

export default RecipientDashboardScreen;