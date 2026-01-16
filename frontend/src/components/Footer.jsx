import { Card, Container, Row, Col, ListGroup } from 'react-bootstrap';

const Footer = () => {
  return (
    <Container>
      <hr />
      <footer className="mt-3">
        <Row className="text-center">

          <Col className='md-3'>
            <ListGroup variant="flush" as="ul" className="list-unstyled text-small">
              <ListGroup.Item as="li">
                <a href="https://apps.laoagcity.gov.ph/privacy-policy.html" className='link-secondary'>Privacy Policy</a><br />
                <a href="https://apps.laoagcity.gov.ph/terms-of-use.html" className='link-secondary'>Terms of Use</a><br />
                <a href="https://apps.laoagcity.gov.ph/accessibility-statement.html" className='link-secondary'>Accessibility</a><br />
                <a href="#" className='link-secondary'>Help</a>
              </ListGroup.Item>
            </ListGroup>
          </Col>
          <Col className='md-3'>
            <ListGroup variant="flush" className="text-small">
              <ListGroup.Item as="li">
                <a href="mailto:apps@laoagcity" className='link-secondary'>apps@laoagcity.gov.ph</a><br />
                <a href="tel:+63 (077) 771-0001" className='link-secondary'>Phone:+63 (077) 771-0001</a><br />
                Information and Communications Technology Office, City Hall Complex, #10 A.G Tupaz St. Laoag City, 2900, PH
              </ListGroup.Item>
            </ListGroup>
          </Col>
          <Col className='md-3'>
            <ListGroup variant="flush" className="list-unstyled text-small">
              <ListGroup.Item as="li">
                <a href="https://apps.laoagcity.gov.ph/" className='link-secondary'>App Index</a><br />
                <a href="https://elgu-city-of-laoag-ilocos-norte.e.gov.ph/" className='link-secondary'>eLGU</a><br />
                <a href="https://www.gov.ph" className='link-secondary'>Philippine Government</a><br />
                <a href="https://www.dict.gov.ph" className='link-secondary'>DICT</a>
              </ListGroup.Item>
            </ListGroup>
          </Col>
          <Col className='md-3'>
            <img
              src="/aap-bp-logos.jpeg"
              height="118"
              className="d-inline-block"
              alt="Alisto Asenso Progreso Logo"
            />
          </Col>
        </Row>
        <Container className="text-center">
          <p className='mt-3'>&copy; {new Date().getFullYear()} City Government of Laoag. All rights reserved.<br /></p>
          <p className='mt-3'>
            <small>
              This app is developed and maintained by <a href="https://blog.eihcek.com" className='link-secondary'>🌐 eihcek</a><br /> 📊 Information Systems Analyst I<br />💻 Office of the Information and Communications Technology Officer.
            </small>
          </p>
        </Container>
      </footer>

    </Container >
  );
};

export default Footer;