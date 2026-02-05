import { Dropdown, ButtonGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus } from '@fortawesome/free-solid-svg-icons';

const AddToCalendarButton = ({ title, description, startDate, endDate, location }) => {
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour after start

  const formatGoogleDate = (date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const handleGoogle = () => {
    const googleStart = formatGoogleDate(start);
    const googleEnd = formatGoogleDate(end);
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(description)}&dates=${googleStart}/${googleEnd}&location=${encodeURIComponent(location || '')}`;
    window.open(url, '_blank');
  };

  const handleOutlook = () => {
    const url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description)}&startdt=${start.toISOString()}&enddt=${end.toISOString()}&location=${encodeURIComponent(location || '')}`;
    window.open(url, '_blank');
  };

  const handleICS = () => {
    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PROID:-//CommTracker//NONSGML v1.0//EN',
      'BEGIN:VEVENT',
      `DTSTART:${formatDate(start)}`,
      `DTEND:${formatDate(end)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dropdown as={ButtonGroup} className="add-to-calendar-dropdown">
      <Dropdown.Toggle variant="outline-primary" size="sm" className="d-flex align-items-center gap-2">
        <FontAwesomeIcon icon={faCalendarPlus} />
        Add to Calendar
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item onClick={handleGoogle}>Google Calendar</Dropdown.Item>
        <Dropdown.Item onClick={handleOutlook}>Outlook.com</Dropdown.Item>
        <Dropdown.Item onClick={handleICS}>Download .ics (Apple/Desktop Outlook)</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default AddToCalendarButton;
