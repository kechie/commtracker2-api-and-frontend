import React, { useState } from 'react';
import { Modal, Button, Table, Row, Col, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faTimes } from '@fortawesome/free-solid-svg-icons';

const TrackerPrintModal = ({ show, onHide, tracker }) => {
  const [numCopies, setNumCopies] = useState(1);

  if (!tracker) return null;

  const handlePrint = () => {
    window.print();
  };

  const renderPrintContent = (copyIndex) => (
    <div key={copyIndex} className={`printable-copy ${copyIndex > 0 ? 'copy-separator' : ''}`}>
      <div className="print-header">
        <h3>CITY GOVERNMENT OF LAOAG</h3>
        <h4>Document Management and Tracking System V2</h4>
        <p><strong>Routing Slip / Tracking Sheet</strong></p>
      </div>

      <div className="tracker-info-section">
        <Row className="g-1">
          <Col xs={6}>
            <p><span className="tracker-info-label">Serial Number:</span> {tracker.serialNumber}</p>
            <p><span className="tracker-info-label">Date Received:</span> {new Date(tracker.dateReceived).toLocaleDateString()}</p>
          </Col>
          <Col xs={6}>
            <p><span className="tracker-info-label">From:</span> {tracker.fromName}</p>
            <p><span className="tracker-info-label">Title:</span> {tracker.documentTitle}</p>
          </Col>
        </Row>
      </div>

      <div className="tracker-info-section">
        <h5>LCE Action</h5>
        <div className="compact-card">
          <Row className="g-1">
            <Col xs={6}>
              <p><span className="tracker-info-label">Action:</span> {tracker.lceAction === 'others' ? tracker.lceKeyedInAction : tracker.lceAction}</p>
            </Col>
            <Col xs={6}>
              <p><span className="tracker-info-label">Date:</span> {tracker.lceActionDate ? new Date(tracker.lceActionDate).toLocaleDateString() : 'N/A'}</p>
            </Col>
          </Row>
        </div>
      </div>

      <div className="tracker-info-section">
        <h5>Recipients Status</h5>
        <Table bordered size="sm" className="recipients-table m-0">
          <thead>
            <tr>
              <th>Recipient</th>
              <th>Status</th>
              <th>Date/Time</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {tracker.trackerRecipients?.map((tr) => (
              <tr key={tr.id}>
                <td>{tr.recipient?.recipientName || 'N/A'}</td>
                <td className="text-capitalize">{tr.status}</td>
                <td>
                  {tr.completedAt ? new Date(tr.completedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 
                   tr.acknowledgedAt ? new Date(tr.acknowledgedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 
                   tr.readAt ? new Date(tr.readAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                </td>
                <td>{tr.remarks || '—'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <div className="mt-3 d-flex justify-content-between align-items-end">
        <div>
          <p className="small text-muted m-0" style={{ fontSize: '8pt' }}>Generated: {new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} (Copy {copyIndex + 1})</p>
        </div>
        <div style={{ width: '180px', borderTop: '1px solid #000', textAlign: 'center', marginTop: '30px' }}>
          <p className="small m-0" style={{ fontSize: '8pt' }}>Signature / Date</p>
        </div>
      </div>
    </div>
  );

  return (
    <Modal show={show} onHide={onHide} size="lg" className="tracker-print-modal">
      <Modal.Header closeButton className="d-print-none">
        <Modal.Title>Print Tracker Details</Modal.Title>
      </Modal.Header>
      <Modal.Body id="printable-tracker-content">
        <style>
          {`
            @media print {
              @page {
                margin: 0.5cm;
                size: auto;
              }
              body * {
                visibility: hidden;
              }
              #printable-tracker-content, #printable-tracker-content * {
                visibility: visible;
              }
              #printable-tracker-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                font-size: 10pt;
                line-height: 1.2;
              }
              .d-print-none {
                display: none !important;
              }
              .print-header h3 { font-size: 14pt; margin-bottom: 2px; }
              .print-header h4 { font-size: 12pt; margin-bottom: 2px; }
              .print-header p { font-size: 10pt; margin-bottom: 5px; }
              .tracker-info-section h5 { font-size: 11pt; margin-bottom: 5px; margin-top: 10px; }
              .recipients-table th, .recipients-table td { padding: 4px !important; font-size: 9pt; }
              .tracker-info-section p { margin-bottom: 3px; }
              .copy-separator {
                margin-top: 20px;
                border-top: 1px dashed #000;
                padding-top: 20px;
                page-break-before: auto;
              }
            }
            .print-header {
              text-align: center;
              margin-bottom: 10px;
              border-bottom: 1px solid #000;
              padding-bottom: 5px;
            }
            .tracker-info-section {
              margin-bottom: 10px;
            }
            .tracker-info-label {
              font-weight: bold;
              width: 120px;
              display: inline-block;
            }
            .recipients-table th {
              background-color: #f8f9fa !important;
              -webkit-print-color-adjust: exact;
            }
            .compact-card {
              border: 1px solid #dee2e6;
              border-radius: 0.25rem;
              padding: 8px;
            }
            .copy-separator {
              margin-top: 30px;
              border-top: 2px dashed #ccc;
              padding-top: 20px;
            }
          `}
        </style>
        
        {Array.from({ length: numCopies }).map((_, index) => renderPrintContent(index))}

      </Modal.Body>
      <Modal.Footer className="d-print-none justify-content-between">
        <Form.Group className="d-flex align-items-center gap-2">
          <Form.Label className="mb-0">Copies:</Form.Label>
          <Form.Select 
            size="sm" 
            style={{ width: '70px' }} 
            value={numCopies} 
            onChange={(e) => setNumCopies(parseInt(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Form.Select>
        </Form.Group>
        <div>
          <Button variant="secondary" onClick={onHide} className="me-2">
            <FontAwesomeIcon icon={faTimes} className="me-2" />
            Close
          </Button>
          <Button variant="primary" onClick={handlePrint}>
            <FontAwesomeIcon icon={faPrint} className="me-2" />
            Print
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default TrackerPrintModal;
