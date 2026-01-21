// frontend/src/screens/AdminScreen.jsx
//import React from 'react';
import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Table, Button, Modal, Pagination, Form, Row, Col } from 'react-bootstrap';
import { getActivityLogs } from '../utils/api';
import { useNavigate } from 'react-router-dom';
const ActivityLogsDashboardScreen = () => {
  const { user, role } = useAuth();
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getActivityLogs(currentPage, pageSize);
        console.log('Fetched activity logs:', data);
        setLogs(data.data);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems);
        console.log('Activity logs set in state:', data.logs);
      } catch (error) {
        console.error('Error fetching activity logs:', error);
      }
    };

    fetchLogs();
  }, [currentPage, pageSize]);

  const handleBack = () => navigate('/');

  return (
    <div>
      <h1>Activity Logs Dashboard</h1>
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

      <Table striped bordered hover responsive className="table-sm mt-3">
        <thead>
          <tr className='align-top'>
            {/* <th>ID</th> */}
            <th>#</th>
            <th>Entity Type</th>
            <th>User, Action</th>
            <th>Entity ID</th>
            <th>Description</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={log.id}>
              {/* <td>{log.id}</td> */}
              <td>{index + 1}</td>
              <td>{log.entityType}</td>
              <td>{log.user ? log.user.username : 'N/A'}, {log.action}</td>
              <td>{log.entityId}</td>
              <td>{log.description}</td>
              <td>{new Date(log.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {/* ── Improved Pagination ── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-4 gap-3">
        {/* Left side: summary + page size */}
        <div className="d-flex align-items-center gap-3">
          <small className="text-muted">
            Showing {logs.length} of {totalItems} entries
          </small>

          <Form.Group className="d-flex align-items-center gap-2 mb-0">
            <Form.Label className="mb-0 text-nowrap">Rows per page:</Form.Label>
            <Form.Select
              size="sm"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ width: '80px' }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </Form.Select>
          </Form.Group>
        </div>

        {/* Right side: pagination controls */}
        <Pagination size="sm" className="mb-0">
          <Pagination.First
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
          />
          <Pagination.Prev
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          />

          {/* Generate page numbers intelligently */}
          {(() => {
            const pages = [];
            const maxVisible = 5;
            let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
            let end = Math.min(totalPages, start + maxVisible - 1);

            // Adjust start if we're near the end
            if (end - start + 1 < maxVisible) {
              start = Math.max(1, end - maxVisible + 1);
            }

            // First page + ellipsis if needed
            if (start > 1) {
              pages.push(
                <Pagination.Item key={1} onClick={() => setCurrentPage(1)}>
                  1
                </Pagination.Item>
              );
              if (start > 2) {
                pages.push(<Pagination.Ellipsis key="start-ellipsis" />);
              }
            }

            // Visible page range
            for (let i = start; i <= end; i++) {
              pages.push(
                <Pagination.Item
                  key={i}
                  active={i === currentPage}
                  onClick={() => setCurrentPage(i)}
                >
                  {i}
                </Pagination.Item>
              );
            }

            // Last page + ellipsis if needed
            if (end < totalPages) {
              if (end < totalPages - 1) {
                pages.push(<Pagination.Ellipsis key="end-ellipsis" />);
              }
              pages.push(
                <Pagination.Item
                  key={totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </Pagination.Item>
              );
            }

            return pages;
          })()}

          <Pagination.Next
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          />
          <Pagination.Last
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
          />
        </Pagination>
      </div>
    </div>
  );
};

export default ActivityLogsDashboardScreen;