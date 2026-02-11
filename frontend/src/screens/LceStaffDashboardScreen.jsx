// frontend/src/screens/LceStaffDashboardScreen.jsx
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faSpinner,
  faCheck,
  faEye,
  faTimes,
  faCheckDouble,
  faPaperclip,
  faForward,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Button,
  Badge,
  Pagination,
  Table,
  Form,
  InputGroup,
  Dropdown,
  DropdownButton,
  Modal,
  Alert,
  Card,
  Spinner
} from 'react-bootstrap';
import {
  getRecipientTrackers,
  updateRecipientTrackerStatus,
  getAttachment,
  getRecipientAnalytics,
  getTrackerReplySlipAttachment,
} from '../utils/api';
import { useAuth } from '../context/useAuth';
import PdfPreviewModal from '../components/PdfPreviewModal';

const LceStaffDashboardScreen = () => {
  const { user } = useAuth();
  const recipientId = user?.recipientId;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [recipientTrackers, setRecipientTrackers] = useState([]);
  const [stats, setStats] = useState(null);

  // Modal + action state
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState(null); // { id, currentStatus, newStatus }
  const [remark, setRemark] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [attachmentLoading, setAttachmentLoading] = useState(null);
  const [replySlipLoading, setReplySlipLoading] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const [selectedSerialNumber, setSelectedSerialNumber] = useState(null);

  // Pagination & filters
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const fetchData = async () => {
      if (!recipientId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize,
        sort: sortBy,
        order: sortOrder,
        search: debouncedSearchTerm.trim() || undefined,
      };

      try {
        const [trackersRes, statsRes] = await Promise.all([
          getRecipientTrackers(recipientId, params),
          getRecipientAnalytics(recipientId)
        ]);
        setRecipientTrackers(trackersRes.data || []);
        setTotalItems(trackersRes.pagination?.total || trackersRes.data?.length || 0);
        setTotalPages(trackersRes.pagination?.totalPages || 1);
        setStats(statsRes);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [recipientId, currentPage, pageSize, sortBy, sortOrder, debouncedSearchTerm, refreshTrigger]);

  const openConfirmModal = (trackerId, newStatus) => {
    const tracker = recipientTrackers.find(t => t.tracker.id === trackerId);
    if (!tracker) return;

    setSelectedTracker({
      id: trackerId,
      currentStatus: tracker.status || 'pending',
      newStatus,
    });
    setRemark('');
    setShowActionModal(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedTracker || !recipientId) return;
    const { id: trackerId, newStatus } = selectedTracker;
    setActionLoading(prev => ({ ...prev, [trackerId]: true }));
    setShowActionModal(false);

    try {
      const extra = remark.trim() ? { remarks: remark.trim() } : {};
      await updateRecipientTrackerStatus(recipientId, trackerId, newStatus, extra);
      setSuccess(`Status updated to ${newStatus}`);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError('Could not update status');
    } finally {
      setActionLoading(prev => ({ ...prev, [trackerId]: false }));
    }
  };

  const handleViewAttachment = async (item) => {
    const trackerId = item.tracker.id;
    setAttachmentLoading(trackerId);
    try {
      const blob = await getAttachment(recipientId, trackerId);
      const url = URL.createObjectURL(blob);
      setSelectedPdfUrl(url);
      setSelectedSerialNumber(item.tracker.serialNumber);
      setShowPdfModal(true);
    } catch (err) {
      setError('Could not load attachment.');
    } finally {
      setAttachmentLoading(null);
    }
  };

  const handleClosePdfModal = () => {
    if (selectedPdfUrl) URL.revokeObjectURL(selectedPdfUrl);
    setShowPdfModal(false);
    setSelectedPdfUrl(null);
  };

  const getActionConfig = (status) => {
    const configs = {
      approved: { icon: faCheck, color: 'success', label: 'Approve' },
      noted: { icon: faEye, color: 'info', label: 'Note' },
      'in-progress': { icon: faSpinner, color: 'primary', label: 'Set In Progress' },
      rejected: { icon: faTimes, color: 'danger', label: 'Reject' },
      forwarded: { icon: faForward, color: 'secondary', label: 'Forward' },
      completed: { icon: faCheckDouble, color: 'success', label: 'Mark Completed' },
    };
    return configs[status] || { icon: faCheck, color: 'secondary', label: 'Update' };
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>LCE Staff Dashboard</h1>
        <Badge bg="info">Role: LCE Staff</Badge>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {stats && (
        <Row className="mb-4 g-3">
          <Col md={4}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Card.Title className="text-muted small">For Staff Review</Card.Title>
                <h2 className="text-primary">{stats.trackersByStatus?.find(s => s.status === 'pending')?.count || 0}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Card.Title className="text-muted small">In Progress</Card.Title>
                <h2 className="text-info">{stats.trackersByStatus?.find(s => s.status === 'in-progress')?.count || 0}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Card.Title className="text-muted small">Completed</Card.Title>
                <h2 className="text-success">{stats.trackersByStatus?.find(s => s.status === 'completed')?.count || 0}</h2>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <div className="mb-4">
        <InputGroup>
          <InputGroup.Text><FontAwesomeIcon icon={faSearch} /></InputGroup.Text>
          <Form.Control placeholder="Search documents..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </InputGroup>
      </div>

      {loading ? (
        <div className="text-center"><Spinner animation="border" /></div>
      ) : (
        <Table striped bordered hover responsive size="sm">
          <thead className="table-dark">
            <tr>
              <th>Serial</th>
              <th>Title</th>
              <th>From</th>
              <th>Received</th>
              <th className="text-center">File</th>
              <th className="text-center">Status</th>
              <th>Review Action</th>
            </tr>
          </thead>
          <tbody>
            {recipientTrackers.map((item) => (
              <tr key={item.id}>
                <td>{item.tracker?.serialNumber}</td>
                <td>{item.tracker?.documentTitle}</td>
                <td>{item.tracker?.fromName}</td>
                <td>{item.tracker?.dateReceived ? new Date(item.tracker.dateReceived).toLocaleDateString() : '—'}</td>
                <td className="text-center">
                  {item.tracker?.attachment && (
                    <Button size="sm" variant="link" onClick={() => handleViewAttachment(item)}>
                      <FontAwesomeIcon icon={faPaperclip} />
                    </Button>
                  )}
                </td>
                <td className="text-center">
                  <Badge bg={getActionConfig(item.status || 'pending').color}>{item.status || 'pending'}</Badge>
                </td>
                <td>
                  <DropdownButton title="Action" size="sm">
                    {['approved', 'noted', 'in-progress', 'rejected', 'forwarded', 'completed'].map(st => (
                      <Dropdown.Item key={st} onClick={() => openConfirmModal(item.tracker.id, st)}>
                        <FontAwesomeIcon icon={getActionConfig(st).icon} className={`me-2 text-${getActionConfig(st).color}`} />
                        {getActionConfig(st).label}
                      </Dropdown.Item>
                    ))}
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={() => navigate(`/recipients/${recipientId}/trackers/${item.tracker.id}`)}>
                      View Details
                    </Dropdown.Item>
                  </DropdownButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={showActionModal} onHide={() => setShowActionModal(false)}>
        <Modal.Header closeButton><Modal.Title>Staff Review Action</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Staff Remarks / Notes</Form.Label>
            <Form.Control as="textarea" rows={3} value={remark} onChange={e => setRemark(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowActionModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={confirmStatusChange}>Save Action</Button>
        </Modal.Footer>
      </Modal>

      <PdfPreviewModal show={showPdfModal} handleClose={handleClosePdfModal} pdfUrl={selectedPdfUrl} serialNumber={selectedSerialNumber} />
    </Container>
  );
};

export default LceStaffDashboardScreen;
