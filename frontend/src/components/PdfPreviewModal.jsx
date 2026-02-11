import { useState, useRef } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { Document, Page, pdfjs } from 'react-pdf';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedo, faUndo, faRoute } from '@fortawesome/free-solid-svg-icons';
import { QRCodeSVG } from 'qrcode.react';
import Draggable from 'react-draggable';

// Required for react-pdf to work
//pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   'pdfjs-dist/build/pdf.worker.min.js',
//   import.meta.url
// ).toString();

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PdfPreviewModal = ({ show, handleClose, pdfUrl, serialNumber, showQrCode = true }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rotation, setRotation] = useState(0);
  const nodeRef = useRef(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error while loading document:', error);
    setError('Failed to load PDF. Please check the file and try again.');
    setLoading(false);
  };

  const goToPrevPage = () => setPageNumber(prevPage => Math.max(prevPage - 1, 1));
  const goToNextPage = () => setPageNumber(prevPage => Math.min(prevPage + 1, numPages));

  const rotateLeft = () => setRotation(prev => (prev - 90 + 360) % 360);
  const rotateRight = () => setRotation(prev => (prev + 90) % 360);

  const trackingUrl = serialNumber
    ? `${window.location.origin}/public/tracking/${encodeURIComponent(serialNumber)}`
    : null;

  const handleViewRoutingSlip = () => {
    if (trackingUrl) {
      window.open(trackingUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const url = pdfUrl instanceof Blob ? URL.createObjectURL(pdfUrl) : pdfUrl;
    const link = document.createElement('a');
    link.href = url;
    link.download = `document_${serialNumber || 'download'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (pdfUrl instanceof Blob) {
      URL.revokeObjectURL(url);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex justify-content-between align-items-center w-100 me-3">
          <span>PDF Preview {serialNumber && `- ${serialNumber}`}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ textAlign: 'center', maxHeight: '70vh', overflowY: 'auto', position: 'relative' }}>
        {loading && !error &&(
          <div className="text-center">
            <Spinner animation="border" role="status" />
            <p className="mt-2">Loading PDF...</p>
          </div>
        )}
        {error && <Alert variant="danger">{error}</Alert>}

        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Document
            file={pdfUrl}
            className="d-flex justify-content-center"
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            onLoadStart={() => setLoading(true)}
            options={{
              cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
              cMapPacked: true,
            }}
          >
            {!loading && !error && <Page pageNumber={pageNumber} rotate={rotation} renderAnnotationLayer={false} renderTextLayer={false} />}
          </Document>

          {!loading && !error && serialNumber && showQrCode && (
            <Draggable bounds="parent" nodeRef={nodeRef}>
              <div
                ref={nodeRef}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  zIndex: 10,
                  background: 'white',
                  padding: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  cursor: 'move'
                }}
                title={`Serial Number: ${serialNumber} (Drag to move)`}
              >
                <div style={{ fontSize: '10px', marginTop: '2px', fontWeight: 'bold', userSelect: 'none' }}>RECEIVED</div>
                <div style={{ fontSize: '10px', marginTop: '2px', fontWeight: 'bold', userSelect: 'none' }}>CMO ADMIN</div>
                              <QRCodeSVG
                                value={trackingUrl || serialNumber}
                                size={80}
                                level="H"
                                includeMargin={true}
                              />


                <div style={{ fontSize: '10px', marginTop: '2px', fontWeight: 'bold', userSelect: 'none' }}>{serialNumber}</div>
              </div>
            </Draggable>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex justify-content-between align-items-center w-100">
          <div>
            <Button variant="secondary" onClick={goToPrevPage} disabled={pageNumber <= 1}>
              Previous
            </Button>
            <Button variant="secondary" onClick={goToNextPage} disabled={pageNumber >= numPages} className="ms-2">
              Next
            </Button>
          </div>
          <div>
            <Button variant="outline-secondary" onClick={rotateLeft} title="Rotate Left">
              <FontAwesomeIcon icon={faUndo} />
            </Button>
            <Button variant="outline-secondary" onClick={rotateRight} className="ms-2" title="Rotate Right">
              <FontAwesomeIcon icon={faRedo} />
            </Button>
          </div>
          <div>
            <Button variant="outline-info" onClick={handleViewRoutingSlip} disabled={!serialNumber} title="View Routing Slip">
              <FontAwesomeIcon icon={faRoute} className="me-2" />
              Routing Slip
            </Button>
            <Button variant="success" onClick={handleDownload} className="ms-2">
              Download
            </Button>
            <Button variant="info" onClick={handlePrint} className="ms-2">
              Print
            </Button>
          </div>
          <span>
            Page {pageNumber} of {numPages}
          </span>
          <Button variant="primary" onClick={handleClose}>
            Close
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default PdfPreviewModal;
