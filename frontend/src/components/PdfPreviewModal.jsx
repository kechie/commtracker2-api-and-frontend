import { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { Document, Page, pdfjs } from 'react-pdf';

// Required for react-pdf to work
//pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   'pdfjs-dist/build/pdf.worker.min.js',
//   import.meta.url
// ).toString();

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
const PdfPreviewModal = ({ show, handleClose, pdfUrl }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!show) {
      setNumPages(null);
      setPageNumber(1);
      setLoading(true);
      setError(null);
    }
  }, [show]);

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

  const handleDownload = () => {
    if (!pdfUrl) return;
    const url = pdfUrl instanceof Blob ? URL.createObjectURL(pdfUrl) : pdfUrl;
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (pdfUrl instanceof Blob) {
      URL.revokeObjectURL(url);
    }
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    const url = pdfUrl instanceof Blob ? URL.createObjectURL(pdfUrl) : pdfUrl;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;

    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error('Print failed:', e);
        alert('Could not open print dialog. Please try downloading the file and printing it.');
      }
    };
    
    document.body.appendChild(iframe);

    setTimeout(() => {
        document.body.removeChild(iframe);
        if (pdfUrl instanceof Blob) {
            URL.revokeObjectURL(url);
        }
    }, 1000);
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>PDF Preview</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ textAlign: 'center', maxHeight: '70vh', overflowY: 'auto' }}>
        {loading && !error &&(
          <div className="text-center">
            <Spinner animation="border" role="status" />
            <p className="mt-2">Loading PDF...</p>
          </div>
        )}
        {error && <Alert variant="danger">{error}</Alert>}

        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          onLoadStart={() => setLoading(true)}
          options={{
            cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
            cMapPacked: true,
          }}
        >
          {!loading && !error && <Page pageNumber={pageNumber} renderAnnotationLayer={false} renderTextLayer={false} />}
        </Document>
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
