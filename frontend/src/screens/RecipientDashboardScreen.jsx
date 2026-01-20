// frontend/src/screens/RecipientDashboardScreen.jsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSearch } from '@fortawesome/free-solid-svg-icons';
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
  DropdownButton
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dateReceived');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (!recipientId) {
      setError("No recipient ID found. Please log in again.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);

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
        const response = await getRecipientTrackers(recipientId, params);

        setRecipientTrackers(response.data || []);
        setTotalItems(response.pagination?.total || response.data?.length || 0);
        setTotalPages(response.pagination?.totalPages || 1);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load documents. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [recipientId, currentPage, pageSize, sortBy, sortOrder, searchTerm, dateFrom, dateTo]);

  const handleMarkAsCompleted = async (trackerId) => {
    if (!window.confirm('Mark this document as completed?')) return;

    try {
      setLoading(true);
      await updateRecipientTrackerStatus(trackerId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });

      // Optimistic update
      setRecipientTrackers(prev =>
        prev.map(item =>
          item.id === trackerId
            ? { ...item, status: 'completed', completedAt: new Date().toISOString() }
            : item
        )
      );

      setSuccess('Document marked as completed!');
    } catch (err) {
      console.error(err);
      setError('Failed to update status.');
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateStatus = async (trackerId, newStatus) => {
    if (!window.confirm(`Change status to "${newStatus}"?`)) return;

    try {
      setLoading(true);
      await updateRecipientTrackerStatus(trackerId, {
        status: newStatus,
        // Optional: add remarks if you collect them later
        // remarks: prompt("Add remarks (optional):") || undefined,
      });

      // Optimistic update
      setRecipientTrackers(prev =>
        prev.map(t =>
          t.id === trackerId ? { ...t, status: newStatus } : t
        )
      );

      setSuccess(`Status updated to ${newStatus}`);
    } catch (err) {
      console.error(err);
      setError('Failed to update status');
    } finally {
      setLoading(false);
    }
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

  return (
    <Container>
      <h1>Recipient Dashboard</h1>

      <Row className="align-items-center mb-4">
        <Col xs="auto">
          <Button variant="light" onClick={handleBack} className="d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faArrowLeft} />
            Back
          </Button>
        </Col>
      </Row>

      {error && <div className="alert alert-danger mb-3">{error}</div>}
      {success && <div className="alert alert-success mb-3">{success}</div>}

      {/* Filters Row */}
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Form.Label className="mb-1 small">Search</Form.Label>
          <InputGroup>
            <InputGroup.Text>
              <FontAwesomeIcon icon={faSearch} size="sm" />
            </InputGroup.Text>
            <Form.Control
              placeholder="Document title, from, remarks..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </InputGroup>
        </Col>

        <Col md={2}>
          <Form.Label className="mb-1 small">Sort by</Form.Label>
          <Form.Select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="dateReceived">Date Received</option>
            <option value="createdAt">Created At</option>
            <option value="updatedAt">Last Updated</option>
            <option value="status">Status</option>
          </Form.Select>
        </Col>

        <Col md={2}>
          <Form.Label className="mb-1 small">Order</Form.Label>
          <Form.Select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
              setCurrentPage(1);
            }}
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
            onChange={(e) => {
              setDateFrom(e.target.value);
              setCurrentPage(1);
            }}
          />
        </Col>

        <Col md={2}>
          <Form.Label className="mb-1 small">To</Form.Label>
          <Form.Control
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setCurrentPage(1);
            }}
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
          No documents found matching your filters.
        </div>
      ) : (
        <Table striped bordered hover responsive size="sm">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Serial / Ref</th>
              <th>Document Title</th>
              <th>From</th>
              <th>Date Received</th>
              <th>Status</th>
              <th>LCE Action / Date</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recipientTrackers.map((item, index) => (
              <tr key={item.id}>
                <td>{(currentPage - 1) * pageSize + index + 1}</td>
                <td>{item.tracker?.serialNumber || '-'}</td>
                <td>{item.tracker?.documentTitle || '—'}</td>
                <td>{item.tracker?.fromName || '—'}</td>
                <td>
                  {item.tracker?.dateReceived
                    ? new Date(item.tracker.dateReceived).toLocaleDateString()
                    : '—'}
                </td>
                <td>
                  {item.status === 'pending' ? (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleMarkAsCompleted(item.id)}
                    >
                      Mark Completed
                    </Button>
                  ) : (
                    <Badge
                      bg={
                        item.status === 'approved' ? 'success' :
                          item.status === 'noted' ? 'info' :
                            item.status === 'in-progress' ? 'primary' :
                              item.status === 'rejected' ? 'danger' :
                                item.status === 'forwarded' ? 'secondary' :
                                  item.status === 'completed' ? 'dark' :
                                    'secondary'
                      }
                      className="text-uppercase"
                    >
                      {item.status || 'unknown'}
                    </Badge>
                  )}

                  {item.status === 'completed' && item.completedAt && (
                    <div className="mt-1">
                      <small>
                        {new Date(item.completedAt).toLocaleDateString()}
                      </small>
                    </div>
                  )}
                </td>
                <td>
                  {item.tracker?.dateReceived
                    ? new Date(item.tracker.dateReceived).toLocaleDateString()
                    : '—'}
                </td>
                <td>
                  {item.updatedAt
                    ? new Date(item.updatedAt).toLocaleDateString()
                    : '—'}
                </td>
                {/* New Actions Column */}
                <td>
                  <DropdownButton
                    id={`actions-${item.id}`}
                    title="Actions"
                    size="sm"
                    variant="outline-secondary"
                    drop="down-centered"   // or "down", "up", etc.
                  >
                    <Dropdown.Item
                      onClick={() => handleUpdateStatus(item.id, 'approved')}
                      disabled={item.status === 'approved'}
                    >
                      Approve
                    </Dropdown.Item>

                    <Dropdown.Item
                      onClick={() => handleUpdateStatus(item.id, 'noted')}
                      disabled={item.status === 'noted'}
                    >
                      Note
                    </Dropdown.Item>

                    <Dropdown.Item
                      onClick={() => handleUpdateStatus(item.id, 'in-progress')}
                      disabled={item.status === 'in-progress'}
                    >
                      Set In Progress
                    </Dropdown.Item>

                    <Dropdown.Item
                      onClick={() => handleUpdateStatus(item.id, 'rejected')}
                      disabled={item.status === 'rejected'}
                    >
                      Reject
                    </Dropdown.Item>

                    <Dropdown.Item
                      onClick={() => handleUpdateStatus(item.id, 'forwarded')}
                      disabled={item.status === 'forwarded'}
                    >
                      Forward
                    </Dropdown.Item>

                    {/* Keep Mark Completed as separate or include here */}
                    {item.status === 'pending' && (
                      <Dropdown.Item
                        onClick={() => handleMarkAsCompleted(item.id)}
                        className="text-success"
                      >
                        Mark Completed
                      </Dropdown.Item>
                    )}

                    {/* Optional: Add remarks / view details later */}
                    <Dropdown.Divider />
                    <Dropdown.Item
                      onClick={() => handleViewDetails(item.id)}
                      className="text-info"
                    >
                      View Details / Add Remarks
                    </Dropdown.Item>
                  </DropdownButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <>
          <Row className="mt-4 align-items-center">
            <Col md={4}>
              <Form.Group className="d-flex align-items-center gap-2">
                <Form.Label className="mb-0 small">Per page:</Form.Label>
                <Form.Select
                  size="sm"
                  style={{ width: '80px' }}
                  value={pageSize}
                  onChange={(e) => {
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
                <Pagination.First
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                />

                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, currentPage - 3) + i;
                  if (pageNum > totalPages) return null;
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
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default RecipientDashboardScreen;