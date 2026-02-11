import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, FloatingLabel, Alert, Container, Card, Row, Col, Badge, Pagination, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { getTrackers, createTracker, updateTracker, deleteTracker, getAllRecipients, getTrackerAttachment, getTrackerReplySlipAttachment } from '../utils/api';
import DualListBox from '../components/DualListBox';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faPlus, faEdit, faTrash, faArrowLeft, faEye, faInfoCircle, faFileText } from '@fortawesome/free-solid-svg-icons';
import { faPlus, faEdit, faTrash, faArrowLeft, faFileText, faEye, faSearch, faTimes, faReply } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/useAuth';
import PdfPreviewModal from '../components/PdfPreviewModal';

const TrackersScreen = () => {
  //const { user, role } = useAuth();
  const { role } = useAuth();
  const [trackers, setTrackers] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTracker, setEditingTracker] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  //const [pdfUrl, setPdfUrl] = useState(null);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const [selectedSerialNumber, setSelectedSerialNumber] = useState(null);
  const [showQrCodeInModal, setShowQrCodeInModal] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTrackers, setTotalTrackers] = useState(0);
  const [sortBy] = useState('createdAt');
  const [sortOrder] = useState('DESC');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [formData, setFormData] = useState({
    serialNumber: '',
    fromName: '',
    documentTitle: '',
    dateReceived: new Date().toISOString().split('T')[0],
    lceAction: null,
    lceKeyedInAction: '',
    lceActionDate: new Date().toISOString().split('T')[0],
    lceRemarks: '',
    attachment: null,
    attachmentMimeType: '',
    replySlipAttachment: null,
    replySlipAttachmentMimeType: '',
    isConfidential: false,
    recipientIds: [], // Array of recipient IDs to assign
  });

  // Debounce search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [trackersData, recipientsData] = await Promise.all([
          getTrackers(currentPage, pageSize, sortBy, sortOrder, debouncedSearch),
          getAllRecipients()
        ]);

        // Extract data correctly from response
        const trackersList = trackersData.data || trackersData;
        setTrackers(Array.isArray(trackersList) ? trackersList : []);
        setRecipients(recipientsData.recipients || recipientsData);

        // Handle pagination metadata if present
        if (trackersData.pagination) {
          setTotalPages(trackersData.pagination.totalPages);
          setTotalTrackers(trackersData.pagination.total);
        } else {
          // Fallback for non-paginated response
          const totalCount = Array.isArray(trackersList) ? trackersList.length : 0;
          setTotalPages(1);
          setTotalTrackers(totalCount);
        }
        setError(null);
        //console.log('Fetched trackers:', trackersList);
        //console.log('Fetched recipients:', recipientsData.recipients || recipientsData);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentPage, pageSize, sortBy, sortOrder, debouncedSearch]);

  const fetchTrackers = async () => {
    const data = await getTrackers(currentPage, pageSize, sortBy, sortOrder, debouncedSearch);
    const trackersList = data.data || data;
    setTrackers(Array.isArray(trackersList) ? trackersList : []);
    if (data.pagination) {
      setTotalPages(data.pagination.totalPages);
      setTotalTrackers(data.pagination.total);
    } else {
      const totalCount = Array.isArray(trackersList) ? trackersList.length : 0;
      setTotalPages(1);
      setTotalTrackers(totalCount);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingTracker(null);
    setFormData({
      serialNumber: '',
      fromName: '',
      documentTitle: '',
      dateReceived: '',
      isConfidential: false,
      lceAction: '',
      lceKeyedInAction: '',
      lceActionDate: '',
      attachment: null,
      attachmentMimeType: '',
      replySlipAttachment: null,
      replySlipAttachmentMimeType: '',
      recipientIds: [],
    });
  };

  const handleShowPdfPreview = async (tracker) => {
    if (!tracker || !tracker.id) return;
    setError(null);
    try {
      const blob = await getTrackerAttachment(tracker.id);
      if (!blob) {
        throw new Error('No attachment found');
      }
      setSelectedPdfUrl(blob);
      setSelectedSerialNumber(tracker.serialNumber);
      setShowQrCodeInModal(true);
      setShowPdfModal(true);
    } catch (err) {
      console.error('View attachment failed:', err);
      setError(err?.response?.data?.message || 'Could not load attachment.');
    }
  }

  const handleShowReplySlipPreview = async (tracker) => {
    if (!tracker || !tracker.id) return;
    setError(null);
    try {
      const blob = await getTrackerReplySlipAttachment(tracker.id);
      if (!blob) {
        throw new Error('No reply slip attachment found');
      }
      setSelectedPdfUrl(blob);
      setSelectedSerialNumber(tracker.serialNumber);
      setShowQrCodeInModal(false);
      setShowPdfModal(true);
    } catch (err) {
      console.error('View reply slip failed:', err);
      setError(err?.response?.data?.message || 'Could not load reply slip.');
    }
  }

  const handleClosePdfPreview = () => {
    setShowPdfModal(false);
    setSelectedSerialNumber(null);
  };

  const handleShow = (tracker = null) => {
    setError(null);
    if (tracker) {
      setEditingTracker(tracker);
      // Extract recipient IDs from trackerRecipients array
      const recipientIds = tracker.trackerRecipients
        ? tracker.trackerRecipients.map(tr => tr.recipientId)
        : [];
      setFormData({
        serialNumber: tracker.serialNumber || '',
        fromName: tracker.fromName || '',
        documentTitle: tracker.documentTitle || '',
        dateReceived: tracker.dateReceived ? new Date(tracker.dateReceived).toISOString().split('T')[0] : '',
        isConfidential: tracker.isConfidential || false,
        lceAction: tracker.lceAction || '',
        lceKeyedInAction: tracker.lceKeyedInAction || '',
        lceActionDate: tracker.lceActionDate ? new Date(tracker.lceActionDate).toISOString().split('T')[0] : '',
        recipientIds: recipientIds,
        replySlipAttachment: tracker.replySlipAttachment || null,
        replySlipAttachmentMimeType: tracker.replySlipAttachmentMimeType || '',
      });
    }
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked, options } = e.target;
    if (name === 'recipientIds') {
      const selectedIds = Array.from(options).filter(option => option.selected).map(option => option.value);
      setFormData(prev => ({ ...prev, recipientIds: selectedIds }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingTracker) {
        await updateTracker(editingTracker.id, formData);
      } else {
        await createTracker(formData);
        setSuccess('DocTrkr2 created successfully!');
      }
      fetchTrackers();
      handleClose();
    } catch (err) {
      setError(err.message || 'Error saving DocTrkr2');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tracker?')) {
      try {
        await deleteTracker(id);
        setSuccess('DocTrkr2 deleted successfully!');
        fetchTrackers();
      } catch (err) {
        setError(err.message || 'Failed to delete tracker');
      }
    }
  };
  const navigate = useNavigate();
  const handleBack = () => {
    navigate('/receiving-dashboard');
  }
  return (
    <Container>
      {/*console.log('Rendering TrackersScreen with trackers:', trackers)*/}
      {/*console.log('Recipients available:', recipients.recipients)*/}
      <Row className='align-items-center mb-3'>
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
      <Col>
        <h4 className="text-center">Document Management and Tracking System V2</h4>
        </Col>
      </Row>
      {/*<Row className="align-items-left mb-3">

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
      </Row>*/}
      <Row className="align-items-left mb-3">
        <Col md={8}>
          <Form.Group className="d-flex gap-2">
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
                  onClick={() => {
                    setSearch('');
                    setDebouncedSearch('');
                    setCurrentPage(1);
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </Button>
              )}
            </div>
          </Form.Group>
        </Col>
        <Col md={4} className="text-end">
          <Button variant="primary" className="mb-3" onClick={() => handleShow()}>
            <i className="fas fa-plus"></i>
            <FontAwesomeIcon icon={faPlus} className="me-2" />New DocTrkr2
          </Button>
        </Col>
      </Row>
      <Row>
        {error && <Alert variant="danger" dismissible>{error}</Alert>}
        {success && <Alert variant="success" dismissible>{success}</Alert>}
        {loading ? (
          <p>Loading trackers...</p>
        ) : (
          <Table striped bordered hover responsive="lg">
            <thead className='align-bottom' variant='light'>
              <tr>
                <th>Serial Number</th>
                <th>From</th>
                <th>Title</th>
                <th>Recipients & Status</th>
                <th>Date Received</th>
                <th>LCE Action, Date</th>
                {/* <th>Confidential</th> */}
                <th>LCE Reply, Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trackers.map((tracker) => {
                // Get recipient info from trackerRecipients
                const trackerRecipients = tracker.trackerRecipients || [];
                const recipientNames = trackerRecipients
                  .map(tr => tr.recipient?.recipientName)
                  .filter(Boolean)
                  .join(', ');

                // Count recipients by status
                const statusCounts = {
                  pending: trackerRecipients.filter(tr => tr.status === 'pending').length,
                  seen: trackerRecipients.filter(tr => tr.isSeen).length,
                  read: trackerRecipients.filter(tr => tr.isRead).length,
                  acknowledged: trackerRecipients.filter(tr => tr.status === 'acknowledged').length,
                  completed: trackerRecipients.filter(tr => tr.status === 'completed').length,
                };

                return (
                  <tr key={tracker.id}>
                    <td>{tracker.serialNumber}</td>
                    <td>{tracker.fromName}</td>
                    <td>{tracker.documentTitle}</td>
                    <td>
                      <div className="mb-2">
                        <small className="text-muted d-block">{recipientNames}</small>
                      </div>
                      <div className="d-flex gap-1 flex-wrap">
                        {statusCounts.pending > 0 && (
                          <Badge bg="secondary">Pending: {statusCounts.pending}</Badge>
                        )}
                        {statusCounts.seen > 0 && (
                          <Badge bg="info">Seen: {statusCounts.seen}</Badge>
                        )}
                        {statusCounts.read > 0 && (
                          <Badge bg="primary">Read: {statusCounts.read}</Badge>
                        )}
                        {statusCounts.acknowledged > 0 && (
                          <Badge bg="warning">Ack: {statusCounts.acknowledged}</Badge>
                        )}
                        {statusCounts.completed > 0 && (
                          <Badge bg="success">Done: {statusCounts.completed}</Badge>
                        )}
                        {statusCounts.rejected > 0 && (
                          <Badge bg="danger">Rejected: {statusCounts.rejected}</Badge>
                        )}
                      </div>
                    </td>
                    <td>{new Date(tracker.dateReceived).toLocaleDateString()}</td>
                    <td>{tracker.lceAction === 'others' ? tracker.lceKeyedInAction : tracker.lceAction} , {tracker.lceActionDate ? new Date(tracker.lceActionDate).toLocaleDateString() : 'N/A'}</td>
                    {/* <td>{tracker.isConfidential ? 'Yes' : 'No'}</td> */}
                    <td>{tracker.lceReplyDate ? new Date(tracker.lceReplyDate).toLocaleDateString() : ''} {tracker.lceReply == 'pending' ? tracker.lceReply : <span className="text-muted">No reply yet</span>} </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button variant="light" size="sm" onClick={() => handleShow(tracker)} title="Edit">
                          <FontAwesomeIcon icon={faEdit} />
                        </Button>
                        {tracker.attachment && (
                          <Button variant='outline-success'
                            size="sm"
                            onClick={() => handleShowPdfPreview(tracker)}
                            title="View Attachment"
                          >
                            <FontAwesomeIcon icon={faFileText} />
                          </Button>
                        )}
                        {tracker.replySlipAttachment && (
                          <Button variant='outline-success'
                            size="sm"
                            onClick={() => handleShowReplySlipPreview(tracker)}
                            title="View Reply Slip"
                          >
                            <FontAwesomeIcon icon={faReply} />
                          </Button>
                        )}
                        <OverlayTrigger
                          placement="left"
                          delay={{ show: 250, hide: 400 }}
                          overlay={
                            <Tooltip id={`tooltip-view-${tracker.id}`}>
                              <strong>Recipients & Status:</strong><br />
                              {tracker.trackerRecipients?.length || 0} assigned<br />
                              Pending: {statusCounts.pending} | Completed: {statusCounts.completed}<br />
                              {/* Add more summary info if needed */}
                              {tracker.trackerRecipients.map(tr => (
                                <div key={tr.id}>
                                  {tr.recipient?.initial || '—'} —
                                  <span className={tr.status === 'pending' ? 'text-warning' : 'text-success'}>
                                    {tr.status}
                                  </span>
                                  {tr.completedAt && ` (done ${new Date(tr.completedAt).toLocaleDateString()})`}
                                  {tr.remarks && ` — Remarks: ${tr.remarks}`}
                                </div>
                              ))}
                              {/* <small>Hover to see quick overview</small> */}
                            </Tooltip>
                          }
                        >
                          <Button variant="light" size="sm" title="View Details">
                            <FontAwesomeIcon icon={faEye} />
                          </Button>
                        </OverlayTrigger>
                        {(role === 'admin' || role === 'superadmin') && <Button variant="danger" size="sm" onClick={() => handleDelete(tracker.id)} title="Delete"><FontAwesomeIcon icon={faTrash} /></Button>}
                      </div>
                    </td>

                  </tr>
                );
              })}
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
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalTrackers)} of {totalTrackers} {/* trackers */}
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

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleClose} size='lg'>
        <Modal.Header closeButton>
          <Modal.Title>{editingTracker ? 'Edit' : 'New'} DocTrkr2</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Col>
            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Card><Card.Header>Tracker Details</Card.Header>
                <Card.Body>
                  <FloatingLabel controlId="serialNumber" label="Serial Number" className="mb-3">
                    <Form.Control
                      type="text"
                      name="serialNumber"
                      value={formData.serialNumber}
                      onChange={handleChange}
                      disabled
                      readOnly={!editingTracker} // Make read-only for new trackers
                      placeholder={editingTracker ? '' : 'Auto-generated on creation'}
                    />
                  </FloatingLabel>
                  {/*<Row>
                    <Form.Group className="mb-3" controlId="serialNumber">
                      <Form.Control
                        type="text"
                        name="serialNumber"
                        value={formData.serialNumber}
                        onChange={handleChange}
                        disabled
                        readOnly={!editingTracker} // Make read-only for new trackers
                        placeholder={editingTracker ? '' : 'Auto-generated on creation'}
                      />
                    </Form.Group>
                  </Row> */}
                  <Row>
                    <FloatingLabel controlId="documentTitle" label="Document Title" className="mb-3">
                      <Form.Control type="text" name="documentTitle" value={formData.documentTitle} onChange={handleChange} required placeholder="Document Title" />
                    </FloatingLabel>
                  </Row>
                  {/* <Row>
                    <Form.Group className="mb-3" controlId="documentTitle">
                      <Form.Label>Title</Form.Label>
                      <Form.Control type="text" name="documentTitle" value={formData.documentTitle} onChange={handleChange} required />
                      <Form.Text className="text-muted">Document Tracker title.</Form.Text>
                    </Form.Group>
                  </Row>*/}
                  <Row>
                    <Col md={6}>
                      <FloatingLabel controlId="fromName" label="From" className="mb-3">
                        <Form.Control type="text" name="fromName" value={formData.fromName} onChange={handleChange} required placeholder="From" />
                      </FloatingLabel>
                    </Col>
                    <Col md={6}>
                      <FloatingLabel controlId="dateReceived" label="Date Received" className="mb-3">
                        <Form.Control type="date" name="dateReceived" value={formData.dateReceived} onChange={handleChange} required placeholder="Date Received" />
                      </FloatingLabel>
                    </Col>
                  </Row>
                  {/* <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3" controlId="fromName">

                  <Form.Control type="text" name="fromName" value={formData.fromName} onChange={handleChange} required />
                  <Form.Text className="text-muted">Sender's name or organization.</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="dateReceived">

                  <Form.Control type="date" name="dateReceived" value={formData.dateReceived} onChange={handleChange} required />
                  <Form.Text className="text-muted">Date the document was received.</Form.Text>
                </Form.Group>
              </Col>
                </Row>*/}
                </Card.Body>
              </Card>
              <br />
              <Card>
                <Card.Header>LCE Action Section</Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <FloatingLabel controlId='lceAction' label='LCE Action' className='mb-3'>
                        <Form.Select name="lceAction" value={formData.lceAction} onChange={handleChange} placeholder="Enter LCE Action">
                          <option value="action">Select action</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="disapproved">Disapproved</option>
                          <option value="for your comments">For Your Comments</option>
                          <option value="for review">For Review</option>
                          <option value="for dissemination">For Dissemination</option>
                          <option value="for compliance">For Compliance</option>
                          <option value="pls facilitate">Please Facilitate</option>
                          <option value="noted">Noted</option>
                          <option value="check availability of funds">Check Availability of Funds</option>
                          <option value="others">Others</option>
                        </Form.Select>
                      </FloatingLabel>
                    </Col>
                    <Col md={6}>

                      <FloatingLabel controlId='lcdActionDate' label='LCE Action Date' className='mb-3'>
                        <Form.Control type="date" name="lceActionDate" value={formData.lceActionDate} onChange={handleChange} />
                      </FloatingLabel>
                    </Col>
                    <Col md={12} hidden={formData.lceAction !== 'others'}>
                      {formData.lceAction === 'others' && (
                        <FloatingLabel controlId="lceKeyedInAction" label="Please specify LCE Action" className="mb-3">
                          <Form.Control
                            type="text"
                            name="lceKeyedInAction"
                            value={formData.lceKeyedInAction}
                            onChange={handleChange}
                            placeholder="Enter LCE Action"
                          />
                        </FloatingLabel>
                      )}
                    </Col>
                    {/*/<Col ><Form.Group className="mb-3" controlId="lceActionDate">
                      <Form.Control type="date" name="lceActionDate" value={formData.lceActionDate} onChange={handleChange} />
                      <Form.Text className="text-muted">LCE Action Date.</Form.Text>
                    </Form.Group>
                    </Col>
                    *<Col>
                      <Form.Group className="mb-3" controlId="lceAction">
                        <Form.Label>Action</Form.Label>
                        <Form.Select name="lceAction" value={formData.lceAction} onChange={handleChange} placeholder="Enter LCE Action">
                          <option value="">Select action</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="disapproved">Disapproved</option>
                          <option value="for your comments">For Your Comments</option>
                          <option value="for review">For Review</option>
                          <option value="for dissemination">For Dissemination</option>
                          <option value="for compliance">For Compliance</option>
                          <option value="pls facilitate">Please Facilitate</option>
                          <option value="noted">Noted</option>
                          <option value="check availability of fund">Check Availability of Fund</option>
                          <option value="others">Others</option>
                        </Form.Select>
                        <Form.Text className="text-muted">LCE Action.</Form.Text>
                      </Form.Group>
                    </Col>*/}
                  </Row>
                </Card.Body>
              </Card>
              <br />
              <Card>
                <Card.Header>Recipients Assignment</Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3 d-flex justify-content-center" controlId="recipientIds" style={{ maxWidth: '950px', width: '100%' }}>
                    {/* <Form.Label>Recipients</Form.Label> */}
                    <DualListBox
                      available={recipients}
                      selected={recipients.filter(r => formData.recipientIds.includes(r.id))}
                      onSelected={(selectedIds) => {
                        setFormData(prev => ({
                          ...prev,
                          recipientIds: selectedIds
                        }));
                      }}
                      availableLabel="Available Recipients"
                      selectedLabel="Selected Recipients"
                      displayProp="recipientName"
                      valueProp="id"
                    />
                  </Form.Group>
                  {/* <Form.Text className="text-muted">Select recipients to assign the document tracker to.</Form.Text> */}
                </Card.Body>
              </Card>
              <br />
              <Card>
                <Card.Header>Attachment</Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <FloatingLabel controlId="attachment" label="Main Attachment" className="mb-3">
                        <Form.Control type="file" name="attachment" onChange={(e) => {
                          const file = e.target.files[0];
                          setFormData(prev => ({
                            ...prev,
                            attachment: file,
                            attachmentMimeType: file ? file.type : '',
                          }));
                        }} />
                      </FloatingLabel>
                    </Col>
                    <Col md={6}>
                      <FloatingLabel controlId="replySlipAttachment" label="Reply Slip Attachment" className="mb-3">
                        <Form.Control type="file" name="replySlipAttachment" onChange={(e) => {
                          const file = e.target.files[0];
                          setFormData(prev => ({
                            ...prev,
                            replySlipAttachment: file,
                            replySlipAttachmentMimeType: file ? file.type : '',
                          }));
                        }} />
                      </FloatingLabel>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
              <Form.Group className="mb-3" controlId="isConfidential">
                <Form.Check type="switch" name="isConfidential" label="Confidential" checked={formData.isConfidential} onChange={handleChange} disabled />
              </Form.Group>
              <Button variant="primary" type="submit">
                {editingTracker ? 'Update' : 'Create'}
              </Button>
            </Form>
          </Col>
        </Modal.Body >
      </Modal >

      <PdfPreviewModal
        key={selectedSerialNumber || 'none'}
        show={showPdfModal}
        handleClose={handleClosePdfPreview}
        pdfUrl={selectedPdfUrl}
        serialNumber={selectedSerialNumber}
        showQrCode={showQrCodeInModal}
      />
    </Container >
  );
};

export default TrackersScreen;
