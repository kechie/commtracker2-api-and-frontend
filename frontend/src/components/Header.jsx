import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap'; // Import NavDropdown
import { LinkContainer } from 'react-router-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSignInAlt, faSignOutAlt, faUser, faUserCog, faFileAlt, faChartBar, faCalendarAlt } from '@fortawesome/free-solid-svg-icons'; // Import more icons
import { useAuth } from '../context/useAuth'; // Import useAuth
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Header = () => {
  const { isAuthenticated, user, role, logout } = useAuth();
  const navigate = useNavigate();

  const logoutHandler = () => {
    logout();
    navigate('/login'); // Redirect to login after logout
  };

  const canAccessTrackers = ['receiving', 'admin', 'superadmin'].includes(role);
  const canAccessReceivingDashboard = ['receiving', 'admin', 'superadmin'].includes(role);
  const canAccessCalendar = ['recipient', 'admin', 'superadmin'].includes(role);

  return (
    <header>
      <Navbar bg="dark" variant="dark" expand="lg" collapseOnSelect>
        <Container>
          <LinkContainer to="/">
            <Navbar.Brand>
              <FontAwesomeIcon icon={faPaperPlane} /> DocTrkr2MS
            </Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              {isAuthenticated ? (
                <>
                  {/* Receiving Dashboard Link */}
                  {canAccessReceivingDashboard && (
                    <LinkContainer to="/receiving-dashboard">
                      <Nav.Link>
                        <FontAwesomeIcon icon={faChartBar} className="me-1" /> Receiving
                      </Nav.Link>
                    </LinkContainer>
                  )}

                  {/* Trackers Link */}
                  {canAccessTrackers && (
                    <LinkContainer to="/trackers">
                      <Nav.Link>
                        <FontAwesomeIcon icon={faFileAlt} className="me-1" /> DocTrkr2s
                      </Nav.Link>
                    </LinkContainer>
                  )}

                  {/* Calendar Link */}
                  {canAccessCalendar && (
                    <LinkContainer to="/calendar">
                      <Nav.Link>
                        <FontAwesomeIcon icon={faCalendarAlt} className="me-1" /> Calendar
                      </Nav.Link>
                    </LinkContainer>
                  )}

                  {/* Admin Link (only for admin/superadmin) */}
                  {(role === 'admin' || role === 'superadmin') && (
                    <LinkContainer to="/admin">
                      <Nav.Link>
                        <FontAwesomeIcon icon={faUserCog} className="me-1" /> Admin
                      </Nav.Link>
                    </LinkContainer>
                  )}
                  {/*Monitor Link (only for monitor role) */}
                  {(role === 'monitor' || role === 'admin' || role === 'superadmin') && (
                    <LinkContainer to="/activity-logs-dashboard">
                      <Nav.Link>
                        <FontAwesomeIcon icon={faChartBar} className="me-1" /> Activity Logs
                      </Nav.Link>
                    </LinkContainer>
                  )}
                  {/* User Management Link (only for admin/superadmin)
                  {(role === 'admin' || role === 'superadmin') && (
                    <LinkContainer to="/users-management">
                      <Nav.Link>
                        <FontAwesomeIcon icon={faUserCog} className="me-1" /> User Management
                      </Nav.Link>
                    </LinkContainer>
                  )}*/}

                  {/* Recipient Management Link (only for admin/superadmin)
                  {(role === 'admin' || role === 'superadmin') && (
                    <LinkContainer to="/recipients-management">
                      <Nav.Link>
                        <FontAwesomeIcon icon={faUserCog} className="me-1" /> Recipient Management
                      </Nav.Link>
                    </LinkContainer>
                  )}*/}

                  <NavDropdown title={user?.username || 'Profile'} id="username">
                    <LinkContainer to="/profile">
                      <NavDropdown.Item>
                        <FontAwesomeIcon icon={faUser} className="me-1" /> Profile
                      </NavDropdown.Item>
                    </LinkContainer>
                    <NavDropdown.Item onClick={logoutHandler}>
                      <FontAwesomeIcon icon={faSignOutAlt} className="me-1" /> Logout
                    </NavDropdown.Item>
                  </NavDropdown>
                </>
              ) : (
                <>
                  <LinkContainer to="/login">
                    <Nav.Link>
                      <FontAwesomeIcon icon={faSignInAlt} className="me-1" /> Sign In
                    </Nav.Link>
                  </LinkContainer>
{/*                  <LinkContainer to="/register">
                    <Nav.Link>
                      <FontAwesomeIcon icon={faUser} className="me-1" /> Sign Up
                    </Nav.Link>
                  </LinkContainer> */}
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;
