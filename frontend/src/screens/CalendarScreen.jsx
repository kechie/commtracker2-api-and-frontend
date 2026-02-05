import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Container, Card, Spinner, Alert, Button, Modal, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api from '../utils/api';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CalendarScreen = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?.recipientId) return;

      try {
        setLoading(true);
        // Fetch all trackers with due dates (we can optimize this later to fetch by range)
        const response = await api.get(`/recipients/${user.recipientId}/trackers/all`);

        if (response.data && response.data.data) {
          const calendarEvents = response.data.data
            .filter(item => item.dueDate) // Only items with due dates
            .map(item => ({
              id: item.id, // TrackerRecipient ID
              title: item.tracker.documentTitle || item.tracker.serialNumber,
              start: new Date(item.dueDate),
              end: new Date(item.dueDate), // For now, 1-hour duration or same-day
              allDay: true,
              resource: item,
            }));
          setEvents(calendarEvents);
        }
      } catch (err) {
        console.error('Error fetching calendar events:', err);
        setError('Failed to load calendar events.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleNavigateToTracker = () => {
    if (selectedEvent?.resource?.trackerId) {
       navigate(`/recipient-dashboard/tracker/${selectedEvent.resource.trackerId}`);
    }
  };

  const handleBack = () => {
    //navigate(-1);
    navigate('/recipient-dashboard');
  }
  return (
    <Container fluid className="p-4">
      <h2 className="mb-4">My Calendar (work in progress)</h2>
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
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="shadow-sm">
        <Card.Body style={{ height: '75vh' }}>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center h-100">
              <Spinner animation="border" />
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectEvent={handleSelectEvent}
              views={['month', 'week', 'day', 'agenda']}
              defaultView="month"
              eventPropGetter={(event) => {
                 let backgroundColor = '#3788d8';
                 const status = event.resource.status;
                 if (status === 'completed') backgroundColor = '#28a745';
                 if (status === 'pending') backgroundColor = '#ffc107';
                 if (status === 'rejected') backgroundColor = '#dc3545';

                 return { style: { backgroundColor } };
              }}
            />
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedEvent?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>Due Date:</strong> {selectedEvent?.start?.toLocaleDateString()}</p>
          <p><strong>Status:</strong> {selectedEvent?.resource?.status}</p>
          <p><strong>From:</strong> {selectedEvent?.resource?.tracker?.fromName}</p>
          <p><strong>Remarks:</strong> {selectedEvent?.resource?.remarks || 'None'}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleNavigateToTracker}>
            View Details
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CalendarScreen;
