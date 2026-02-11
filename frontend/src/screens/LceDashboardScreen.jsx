// frontend/src/screens/LceDashboardScreen.jsx
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

const LceDashboardScreen = () => {
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
      setSuccess(`Action applied: ${newStatus}`);
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
        <h1>LCE Dashboard</h1>
        <Badge bg="dark">Role: LCE</Badge>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {stats && (
        <Row className="mb-4 g-3">
          <Col md={4}>
            <Card className="text-center shadow-sm border-0 bg-light text-primary">
              <Card.Body>
                <Card.Title className="text-muted small text-uppercase fw-bold">Pending Approval</Card.Title>
                <h2 className="display-6 fw-bold">{stats.trackersByStatus?.find(s => s.status === 'pending')?.count || 0}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center shadow-sm border-0 bg-light text-info">
              <Card.Body>
                <Card.Title className="text-muted small text-uppercase fw-bold">In Progress</Card.Title>
                <h2 className="display-6 fw-bold">{stats.trackersByStatus?.find(s => s.status === 'in-progress')?.count || 0}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center shadow-sm border-0 bg-light text-success">
              <Card.Body>
                <Card.Title className="text-muted small text-uppercase fw-bold">Signed / Completed</Card.Title>
                <h2 className="display-6 fw-bold">{stats.trackersByStatus?.find(s => s.status === 'completed')?.count || 0}</h2>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <div className="mb-4">
        <InputGroup>
          <InputGroup.Text className="bg-white border-end-0"><FontAwesomeIcon icon={faSearch} className="text-muted" /></InputGroup.Text>
          <Form.Control className="border-start-0 ps-0" placeholder="Search correspondence..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </InputGroup>
      </div>

      {loading ? (
        <div className="text-center p-5"><Spinner animation="grow" variant="primary" /></div>
      ) : (
        <Table hover responsive className="shadow-sm align-middle">
          <thead className="bg-primary text-white">
            <tr>
              <th>Serial</th>
              <th>Document Title</th>
              <th>From</th>
              <th>Received</th>
              <th className="text-center">PDF</th>
              <th className="text-center">Status</th>
              <th>LCE Action</th>
            </tr>
          </thead>
          <tbody>
            {recipientTrackers.map((item) => (
              <tr key={item.id}>
                <td className="fw-bold">{item.tracker?.serialNumber}</td>
                <td>{item.tracker?.documentTitle}</td>
                <td>{item.tracker?.fromName}</td>
                <td className="text-muted small">{item.tracker?.dateReceived ? new Date(item.tracker.dateReceived).toLocaleDateString() : '—'}</td>
                <td className="text-center">
                  {item.tracker?.attachment && (
                    <Button size="sm" variant="outline-primary" className="rounded-circle" onClick={() => handleViewAttachment(item)}>
                      <FontAwesomeIcon icon={faPaperclip} />
                    </Button>
                  )}
                </td>
                <td className="text-center">
                  <Badge pill bg={getActionConfig(item.status || 'pending').color} className="px-3 py-2">
                    {item.status || 'pending'}
                  </Badge>
                </td>
                <td>
                  <DropdownButton title="Decide" size="sm" variant="dark">
                    {['approved', 'noted', 'rejected', 'forwarded', 'completed'].map(st => (
                      <Dropdown.Item key={st} onClick={() => openConfirmModal(item.tracker.id, st)}>
                        <FontAwesomeIcon icon={getActionConfig(st).icon} className={`me-2 text-${getActionConfig(st).color}`} />
                        {getActionConfig(st).label}
                      </Dropdown.Item>
                    ))}
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={() => navigate(`/recipients/${recipientId}/trackers/${item.tracker.id}`)}>
                      Full Document Details
                    </Dropdown.Item>
                  </DropdownButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={showActionModal} onHide={() => setShowActionModal(false)} centered>
        <Modal.Header closeButton className="bg-light"><Modal.Title>Final Decision</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <h5 className="text-muted">Confirming action:</h5>
            <h3 className="text-primary">{selectedTracker?.newStatus?.toUpperCase()}</h3>
          </div>
          <Form.Group>
            <Form.Label className="fw-bold">LCE Remarks / Instructions</Form.Label>
            <Form.Control as="textarea" rows={4} value={remark} onChange={e => setRemark(e.target.value)} placeholder="Type instructions or remarks here..." />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="outline-secondary" onClick={() => setShowActionModal(false)}>Cancel</Button>
          <Button variant="primary" className="px-4" onClick={confirmStatusChange}>Apply Decision</Button>
        </Modal.Footer>
      </Modal>

      <PdfPreviewModal show={showPdfModal} handleClose={handleClosePdfModal} pdfUrl={selectedPdfUrl} serialNumber={selectedSerialNumber} />
    </Container>
  );
};

export default LceDashboardScreen;
