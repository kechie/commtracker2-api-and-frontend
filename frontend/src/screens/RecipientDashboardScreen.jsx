// frontend/src/screens/RecipientDashboardScreen.jsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
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
} from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { getRecipientTrackers, updateRecipientTrackerStatus } from '../utils/api';
import { useAuth } from '../context/useAuth';

const RecipientDashboardScreen = () => {
  const { user } = useAuth();
  const recipientId = user?.recipientId;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [recipientTrackers, setRecipientTrackers] = useState([]);

  // Modal + action state
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState(null); // { id, currentStatus, newStatus }
  const [remark, setRemark] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  // Pagination & filters
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dateReceived');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
// TODO: send {	"status":"seen" } payload to mark as seen when downloading/viewing attachment
// TODO: send { "status":"read" } payload when opening details page
  useEffect(() => {
    const fetchTrackers = async () => {
      if (!recipientId) {
        setError("No recipient ID found. Please log in again.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: pageSize,
        sort: sortBy,
        order: sortOrder,
        search: searchTerm.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };

      try {
        const res = await getRecipientTrackers(recipientId, params);
        setRecipientTrackers(res.data || []);
        setTotalItems(res.pagination?.total || res.data?.length || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      } catch (err) {
        console.error('Fetch trackers failed:', err);
        setError('Failed to load documents. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrackers();
  }, [recipientId, currentPage, pageSize, sortBy, sortOrder, searchTerm, dateFrom, dateTo]);

  const openConfirmModal = (trackerId, newStatus) => {
    console.log('Open confirm modal for tracker:', trackerId, 'to status:', newStatus);
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
    setError(null);
    setSuccess(null);
    setShowActionModal(false);

    try {
      const extra = remark.trim() ? { remarks: remark.trim() } : {};

      await updateRecipientTrackerStatus(recipientId, trackerId, newStatus, extra);

      // optimistic update
      setRecipientTrackers(prev =>
        prev.map(t => (t.id === trackerId ? { ...t, status: newStatus } : t))
      );

      setSuccess(`Status changed to ${newStatus}`);
    } catch (err) {
      console.error('Update failed:', err);
      setError(err?.response?.data?.message || 'Could not update status');
    } finally {
      setActionLoading(prev => ({ ...prev, [trackerId]: false }));
      setSelectedTracker(null);
      setRemark('');
    }
  };

  const handleViewDetails = (recipientId, trackerId) => {
    console.log('View details →', trackerId);
    console.log('Recipient ID:', recipientId);
    //http://localhost:3007/v2/recipients/721587c5-7e32-4d83-a71c-2f2105039ff9/trackers/[object%20Object]
    navigate(`/recipients/${recipientId}/trackers/${trackerId}`);
    updateRecipientTrackerStatus(recipientId, trackerId, 'read').catch(err => {
      console.error('Failed to mark as read:', err);
    });
  };

  const handleViewAttachment = (trackerId) => {
    console.log('View attachment →', trackerId);
    // navigate(`/recipient/tracker/${trackerId}/attachment`);
  };

  const handleBack = () => navigate('/');

  const resetFilters = () => {
    setSearchTerm('');
    setSortBy('dateReceived');
    setSortOrder('DESC');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
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

  const getModalButtonVariant = (status) => {
    if (status === 'rejected') return 'danger';
    if (status === 'approved' || status === 'completed') return 'success';
    return 'primary';
  };

  return (
    <Container>
      <h1>Recipient Dashboard</h1>

      <Row className="align-items-center mb-4">
        <Col xs="auto">
          <Button variant="light" onClick={handleBack} className="d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </Button>
        </Col>
      </Row>

      {error && <div className="alert alert-danger mb-3">{error}</div>}
      {success && <div className="alert alert-success mb-3">{success}</div>}

      {/* Filters */}
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Form.Label className="mb-1 small">Search</Form.Label>
          <InputGroup>
            <InputGroup.Text><FontAwesomeIcon icon={faSearch} size="sm" /></InputGroup.Text>
            <Form.Control
              placeholder="Title, sender, remarks..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </InputGroup>
        </Col>
        <Col md={2}>
          <Form.Label className="mb-1 small">Sort by</Form.Label>
          <Form.Select
            value={sortBy}
            onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
          >
            <option value="dateReceived">Date Received</option>
            <option value="createdAt">Created</option>
            <option value="updatedAt">Last Updated</option>
            <option value="status">Status</option>
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Label className="mb-1 small">Order</Form.Label>
          <Form.Select
            value={sortOrder}
            onChange={e => { setSortOrder(e.target.value); setCurrentPage(1); }}
          >
            <option value="DESC">Newest first</option>
            <option value="ASC">Oldest first</option>
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Label className="mb-1 small">From</Form.Label>
          <Form.Control
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setCurrentPage(1); }}
          />
        </Col>
        <Col md={2}>
          <Form.Label className="mb-1 small">To</Form.Label>
          <Form.Control
            type="date"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setCurrentPage(1); }}
          />
        </Col>
        <Col md="auto" className="d-flex align-items-end">
          <Button variant="outline-secondary" size="sm" onClick={resetFilters}>
            Reset
          </Button>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2">Loading documents...</p>
        </div>
      ) : recipientTrackers.length === 0 ? (
        <div className="text-center my-5 text-muted">
          No documents found.
        </div>
      ) : (
        <Table striped bordered hover responsive size="sm">
          <thead className="table-light">
            <tr>
              <th>Serial / Ref</th>
              <th>Document Title</th>
              <th>From</th>
              <th>Date Received</th>
              <th className="text-center"><FontAwesomeIcon icon={faPaperclip} /></th>
              <th className="text-center">Status</th>
              <th>LCE Action / Date</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recipientTrackers.map((item, index) => {
              const isLoading = actionLoading[item.id];
              return (
                <tr key={item.id} index={index}>
                  <td>{item.tracker?.id || '—'}</td>
                  <td>{item.tracker?.documentTitle || '—'}</td>
                  <td>{item.tracker?.fromName || '—'}</td>
                  <td>
                    {item.tracker?.dateReceived
                      ? new Date(item.tracker.dateReceived).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="text-center">
                    <Button size="sm" variant="info" onClick={() => handleViewAttachment(item.tracker?.id)}>
                      <FontAwesomeIcon icon={faPaperclip} />
                    </Button>
                  </td>
                  <td>
                    <Badge
                      bg={
                        item.status === 'approved' ? 'success' :
                          item.status === 'noted' ? 'info' :
                            item.status === 'in-progress' ? 'primary' :
                              item.status === 'rejected' ? 'danger' :
                                item.status === 'forwarded' ? 'secondary' :
                                  item.status === 'completed' ? 'success' :
                                    'secondary'
                      }
                      className="text-uppercase"
                    >
                      {item.status || 'pending'}
                    </Badge>
                    {item.status === 'completed' && item.completedAt && (
                      <div className="mt-1 small">
                        {new Date(item.completedAt).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td>
                    {item.tracker?.dateReceived
                      ? new Date(item.tracker.dateReceived).toLocaleDateString()
                      : '—'}
                  </td>
                  <td>
                    {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <DropdownButton
                      id={`actions-${item.id}`}
                      title={isLoading ? 'Updating…' : 'Actions'}
                      size="sm"
                      variant="outline-primary"
                      disabled={isLoading}
                    >
                      {['approved', 'noted', 'in-progress', 'rejected', 'forwarded'].map(st => {
                        const { icon, color, label } = getActionConfig(st);
                        const disabled = item.status === st || isLoading;
                        return (
                          <Dropdown.Item
                            key={st}
                            onClick={() => openConfirmModal(item.tracker.id, st)}
                            disabled={disabled}
                          >
                            <FontAwesomeIcon icon={icon} className={`me-2 text-${color}`} />
                            {label}
                          </Dropdown.Item>
                        );
                      })}

                      {item.status !== 'completed' && (
                        <>
                          {/*console.log('Rendering Mark Completed option for tracker:', item.id, item.tracker.id, item.tracker?.documentTitle)*/}
                          <Dropdown.Divider />
                          <Dropdown.Item
                            onClick={() => openConfirmModal(item.tracker.id, 'completed')}
                            className="text-success"
                            disabled={isLoading}
                          >
                            <FontAwesomeIcon icon={faCheckDouble} className="me-2" />
                            Mark Completed
                          </Dropdown.Item>
                        </>
                      )}

                      <Dropdown.Divider />
                      <Dropdown.Item onClick={() => handleViewDetails(recipientId,item.tracker.id)} className="text-info">
                        View Details / Remarks
                      </Dropdown.Item>
                    </DropdownButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      {/* Confirmation Modal */}
      <Modal show={showActionModal} onHide={() => setShowActionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Action</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTracker && (
            <>
              <p className="mb-3">
                Change status from <strong>{selectedTracker.currentStatus}</strong> to{' '}
                <strong>{selectedTracker.newStatus}</strong>?
              </p>

              <Form.Group>
                <Form.Label>
                  {selectedTracker.newStatus === 'rejected' ? 'Reason for rejection' : 'Remarks'}
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={remark}
                  onChange={e => setRemark(e.target.value)}
                  placeholder={
                    selectedTracker.newStatus === 'rejected'
                      ? 'Please explain why...'
                      : 'Optional notes...'
                  }
                />
                <Form.Text className="text-muted small">
                  This will be recorded with the status change.
                </Form.Text>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowActionModal(false)}>
            Cancel
          </Button>
          <Button
            variant={selectedTracker ? getModalButtonVariant(selectedTracker.newStatus) : 'primary'}
            onClick={confirmStatusChange}
            disabled={actionLoading[selectedTracker?.id]}
          >
            {actionLoading[selectedTracker?.id] ? 'Updating…' : 'Confirm'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Pagination */}
      {totalPages > 1 && (
        <Row className="mt-4 align-items-center">
          <Col md={4}>
            <Form.Group className="d-flex align-items-center gap-2">
              <Form.Label className="mb-0 small">Per page:</Form.Label>
              <Form.Select
                size="sm"
                style={{ width: '80px' }}
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option>5</option>
                <option>10</option>
                <option>15</option>
                <option>20</option>
                <option>50</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={4} className="text-center">
            <small className="text-muted">
              Showing {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, totalItems)} of {totalItems}
            </small>
          </Col>

          <Col md={4}>
            <Pagination size="sm" className="mb-0 justify-content-end">
              <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
              <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                const page = Math.max(1, currentPage - 3) + i;
                if (page > totalPages) return null;
                return (
                  <Pagination.Item
                    key={page}
                    active={page === currentPage}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Pagination.Item>
                );
              })}
              <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
              <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
            </Pagination>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default RecipientDashboardScreen;