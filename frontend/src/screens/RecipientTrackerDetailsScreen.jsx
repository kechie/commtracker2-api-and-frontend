import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Button,
  Badge,
  Card,
  Form,
  Spinner,
  Alert
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faDownload, faEye } from '@fortawesome/free-solid-svg-icons';
import { getTrackerDetails, updateRecipientTrackerStatus } from '../utils/api';
import PdfPreviewModal from '../components/PdfPreviewModal';

const RecipientTrackerDetailsScreen = () => {
  const { recipientId, trackerId } = useParams();
  const navigate = useNavigate();

  const [tracker, setTracker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  useEffect(() => {
    const fetchTrackerDetails = async (recipientId, trackerId) => {
      if (!recipientId) {
        setError('No recipient ID found. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getTrackerDetails(recipientId, trackerId);
        const trackerData = response.data;
        console.log('Fetched tracker details:', trackerData);
        if (!trackerData) {
          setError('Tracker not found.');
          setLoading(false);
          return;
        }

        setTracker(trackerData);
      } catch (err) {
        console.error('Error fetching tracker details:', err);
        setError('Failed to load tracker details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrackerDetails(recipientId, trackerId);
  }, [recipientId, trackerId]);

  const handleStatusUpdate = async (newStatus) => {
    if (!tracker) return;

    try {
      setSubmitting(true);
      setError(null);

      await updateRecipientTrackerStatus(recipientId, trackerId, newStatus, {
        remarks: remarks || undefined,
      });

      setSuccess(`Status updated to ${newStatus} successfully!`);
      setTracker(prev => ({
        ...prev,
        status: newStatus
      }));
      setRemarks('');

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadAttachment = () => {
    if (tracker?.tracker?.attachmentUrl) {
      window.open(tracker.tracker.attachmentUrl, '_blank');
    }
  };

  const handleViewAttachment = () => {
    setShowPdfModal(true);
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
  };

  const handleBack = () => {
    navigate('/recipient-dashboard');
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner animation="border" role="status" />
          <p className="mt-2">Loading tracker details...</p>
        </div>
      </Container>
    );
  }

  if (!tracker) {
    return (
      <Container>
        <Row className="mb-3">
          <Col>
            <Button variant="light" onClick={handleBack} className="d-flex align-items-center gap-2">
              <FontAwesomeIcon icon={faArrowLeft} />
              Back
            </Button>
          </Col>
        </Row>
        <Alert variant="danger">
          Tracker not found. Please check the ID and try again.
        </Alert>
      </Container>
    );
  }

  const trackerData = tracker.tracker || {};

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <Button variant="light" onClick={handleBack} className="d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Dashboard
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

      <Card className="mb-4">
        <Card.Header className="bg-light">
          <h2 className="mb-0">{trackerData.documentTitle || 'Document Details'}</h2>
        </Card.Header>
        <Card.Body>
          {/* ... existing card body content ... */}
          <Row className="mb-3">
            <Col md={6}>
              <h5>Serial/Reference Number</h5>
              <p className="text-muted">{trackerData.serialNumber || '—'}</p>
            </Col>
            <Col md={6}>
              <h5>Status</h5>
              <p>
                <Badge
                  bg={
                    tracker.status === 'approved' ? 'success' :
                      tracker.status === 'noted' ? 'info' :
                        tracker.status === 'in-progress' ? 'primary' :
                          tracker.status === 'rejected' ? 'danger' :
                            tracker.status === 'forwarded' ? 'secondary' :
                              tracker.status === 'completed' ? 'success' :
                                'secondary'
                  }
                  className="text-uppercase fs-6"
                >
                  {tracker.status || 'unknown'}
                </Badge>
              </p>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <h5>From</h5>
              <p className="text-muted">{trackerData.fromName || '—'}</p>
            </Col>
            <Col md={6}>
              <h5>Date Received</h5>
              <p className="text-muted">
                {trackerData.dateReceived
                  ? new Date(trackerData.dateReceived).toLocaleDateString()
                  : '—'}
              </p>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <h5>Description / Remarks</h5>
              <p className="text-muted">{trackerData.remarks || '—'}</p>
            </Col>.
          </Row>

          {trackerData.attachmentUrl && (
            <Row className="mb-3">
              <Col>
                <h5>Attachment</h5>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleViewAttachment}
                    className="d-flex align-items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faEye} />
                    View Attachment
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={handleDownloadAttachment}
                    className="d-flex align-items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faDownload} />
                    Download Attachment
                  </Button>
                </div>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header className="bg-light">
          <h5 className="mb-0">Actions</h5>
        </Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Add Remarks (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Add any remarks or notes..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={submitting}
            />
          </Form.Group>

          <div className="d-flex gap-2 flex-wrap">
            <Button
              variant="success"
              onClick={() => handleStatusUpdate('approved')}
              disabled={tracker.status === 'approved' || submitting}
            >
              {submitting ? <Spinner animation="border" size="sm" className="me-2" /> : null}
              Approve
            </Button>
            <Button
              variant="info"
              onClick={() => handleStatusUpdate('noted')}
              disabled={tracker.status === 'noted' || submitting}
            >
              {submitting ? <Spinner animation="border" size="sm" className="me-2" /> : null}
              Note
            </Button>
            <Button
              variant="primary"
              onClick={() => handleStatusUpdate('in-progress')}
              disabled={tracker.status === 'in-progress' || submitting}
            >
              {submitting ? <Spinner animation="border" size="sm" className="me-2" /> : null}
              Set In Progress
            </Button>
            <Button
              variant="danger"
              onClick={() => handleStatusUpdate('rejected')}
              disabled={tracker.status === 'rejected' || submitting}
            >
              {submitting ? <Spinner animation="border" size="sm" className="me-2" /> : null}
              Reject
            </Button>
            <Button
              variant="secondary"

              onClick={() => handleStatusUpdate('forwarded')}
              disabled={tracker.status === 'forwarded' || submitting}
            >
              {submitting ? <Spinner animation="border" size="sm" className="me-2" /> : null}
              Forward
            </Button>
            {tracker.status === 'pending' && (
              <Button
                variant="outline-success"
                onClick={() => handleStatusUpdate('completed')}
                disabled={submitting}
              >
                {submitting ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                Mark Completed
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>

      {trackerData.attachmentUrl && (
        <PdfPreviewModal
          show={showPdfModal}
          handleClose={handleClosePdfModal}
          pdfUrl={trackerData.attachmentUrl}
        />
      )}
    </Container>
  );
};

export default RecipientTrackerDetailsScreen;