import { useEffect, useState } from 'react';
import { Table, Row, Col, Form, Pagination, Alert, Spinner, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { getAllTrackerRecipients } from '../utils/api';

// Paginated, system-wide list of tracker-recipient assignments with status "pending"
// (recipients who haven't taken any action on a document yet).
const PendingActionsPanel = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        setLoading(true);
        const response = await getAllTrackerRecipients({
          status: 'pending',
          search: debouncedSearch,
          page: currentPage,
          limit: pageSize,
          sort: 'createdAt',
          order: 'DESC',
        });
        setItems(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotal(response.pagination?.total || 0);
        setError(null);
      } catch (err) {
        console.error('Error fetching pending actions:', err);
        setError('Failed to load pending actions.');
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, [currentPage, pageSize, debouncedSearch]);

  return (
    <>
      <Row className="align-items-end mb-3">
        <Col md={4}>
          <Form.Label className="mb-1 small">Search</Form.Label>
          <div className="input-group">
            <span className="input-group-text bg-light">
              <FontAwesomeIcon icon={faSearch} />
            </span>
            <Form.Control
              type="text"
              placeholder="Find serial, from, title, or recipient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <Button
                variant="outline-secondary"
                onClick={() => { setSearch(''); setDebouncedSearch(''); setCurrentPage(1); }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </Button>
            )}
          </div>
        </Col>
      </Row>

      <Row>
        {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
        {loading ? (
          <div className="d-flex align-items-center gap-2 py-3">
            <Spinner animation="border" size="sm" role="status" />
            <span>Loading pending actions...</span>
          </div>
        ) : (
          <Table striped bordered hover responsive="lg">
            <thead className="align-bottom" variant="light">
              <tr>
                <th>Serial Number</th>
                <th>Document Title</th>
                <th>From</th>
                <th>Recipient</th>
                <th>Date Received</th>
                <th>Assigned</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.tracker?.serialNumber}</td>
                    <td>{item.tracker?.documentTitle}</td>
                    <td>{item.tracker?.fromName}</td>
                    <td>{item.recipient?.recipientName || '—'}</td>
                    <td>
                      {item.tracker?.dateReceived
                        ? `${new Date(item.tracker.dateReceived).toLocaleDateString()} ${new Date(item.tracker.dateReceived).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : '—'}
                    </td>
                    <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-muted text-center py-4">
                    No pending items{debouncedSearch ? ' match your search' : ''}.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </Row>

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
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total}
            </small>
          </Col>
        </Row>
      )}

      {totalPages > 1 && (
        <Row className="mb-4">
          <Col>
            <Pagination className="justify-content-center">
              <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
              <Pagination.Prev
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              />
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
              <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
            </Pagination>
          </Col>
        </Row>
      )}
    </>
  );
};

export default PendingActionsPanel;
