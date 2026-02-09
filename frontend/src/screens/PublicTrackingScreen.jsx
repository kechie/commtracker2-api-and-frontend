import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPrint, faRoute } from '@fortawesome/free-solid-svg-icons';
import { getPublicRoutingSlip } from '../utils/api';
import { QRCodeSVG } from 'qrcode.react';

const PublicTrackingScreen = () => {
  const { serialNumber } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getPublicRoutingSlip(serialNumber);
        setData(response.data);
      } catch (err) {
        console.error('Error fetching public tracking data:', err);
        setError(err.message || 'Failed to load tracking information. Please verify the serial number.');
      } finally {
        setLoading(false);
      }
    };

    if (serialNumber) {
      fetchData();
    }
  }, [serialNumber]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <hr />
          <Button variant="outline-danger" onClick={() => navigate(-1)}>
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Go Back
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-print-none mb-4 d-flex justify-content-between align-items-center">
        <Button variant="light" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Back
        </Button>
        <Button variant="primary" onClick={handlePrint}>
          <FontAwesomeIcon icon={faPrint} className="me-2" />
          Print Routing Slip
        </Button>
      </div>

      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-primary text-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <div className="bg-white p-2 rounded me-3 d-flex align-items-center justify-content-center">
                <QRCodeSVG 
                  value={window.location.href} 
                  size={60} 
                  level="H"
                />
              </div>
              <div>
                <h3 className="mb-0">
                  <FontAwesomeIcon icon={faRoute} className="me-2" />
                  Routing Slip
                </h3>
                <div className="small opacity-75">Document Tracking History</div>
              </div>
            </div>
            <Badge bg="light" text="dark" className="fs-6">
              {data.serialNumber}
            </Badge>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={6}>
              <h5 className="text-muted small text-uppercase fw-bold">Document Title</h5>
              <p className="fs-5 fw-bold">{data.documentTitle}</p>
            </Col>
            <Col md={6}>
              <h5 className="text-muted small text-uppercase fw-bold">From</h5>
              <p className="fs-5">{data.fromName}</p>
            </Col>
          </Row>
          <Row className="mb-4">
            <Col md={4}>
              <h5 className="text-muted small text-uppercase fw-bold">Date Received</h5>
              <p>{new Date(data.dateReceived).toLocaleDateString()} {new Date(data.dateReceived).toLocaleTimeString()}</p>
            </Col>
            <Col md={4}>
              <h5 className="text-muted small text-uppercase fw-bold">LCE Action</h5>
              <p>
                <Badge bg="info" className="text-uppercase">
                  {data.lceAction === 'others' ? data.lceKeyedInAction : data.lceAction || 'Pending'}
                </Badge>
              </p>
            </Col>
            <Col md={4}>
              <h5 className="text-muted small text-uppercase fw-bold">Action Date</h5>
              <p>{data.lceActionDate ? new Date(data.lceActionDate).toLocaleDateString() : '—'}</p>
            </Col>
          </Row>

          <h5 className="text-muted small text-uppercase fw-bold mb-3">Routing History</h5>
          <Table responsive bordered hover className="align-middle">
            <thead className="table-light text-uppercase small">
              <tr>
                <th>Recipient</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Timeline</th>
              </tr>
            </thead>
            <tbody>
              {data.routing.map((step, index) => (
                <tr key={index}>
                  <td>
                    <div className="fw-bold">{step.recipient}</div>
                    <div className="text-muted small">{step.recipientCode}</div>
                  </td>
                  <td>
                    <Badge
                      bg={
                        step.status === 'completed' ? 'success' :
                        step.status === 'in-progress' ? 'primary' :
                        step.status === 'rejected' ? 'danger' :
                        'secondary'
                      }
                      className="text-uppercase"
                    >
                      {step.status}
                    </Badge>
                  </td>
                  <td>{step.remarks || <span className="text-muted italic small">No remarks</span>}</td>
                  <td className="small">
                    {step.seenAt && (
                      <div className="mb-1 text-nowrap">
                        <Badge bg="light" text="dark" className="me-1">Seen:</Badge>
                        {new Date(step.seenAt).toLocaleString()}
                      </div>
                    )}
                    {step.readAt && (
                      <div className="mb-1 text-nowrap">
                        <Badge bg="light" text="dark" className="me-1">Read:</Badge>
                        {new Date(step.readAt).toLocaleString()}
                      </div>
                    )}
                    {step.acknowledgedAt && (
                      <div className="mb-1 text-nowrap">
                        <Badge bg="light" text="dark" className="me-1">Ack:</Badge>
                        {new Date(step.acknowledgedAt).toLocaleString()}
                      </div>
                    )}
                    {step.completedAt && (
                      <div className="text-nowrap text-success fw-bold">
                        <Badge bg="success" className="me-1">Done:</Badge>
                        {new Date(step.completedAt).toLocaleString()}
                      </div>
                    )}
                    {!step.seenAt && !step.completedAt && <span className="text-muted">Waiting...</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
        <Card.Footer className="text-center text-muted small d-print-block">
          Generated by CommTracker v2 on {new Date().toLocaleString()}
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default PublicTrackingScreen;
