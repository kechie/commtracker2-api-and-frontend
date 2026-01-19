// src/components/ErrorBoundary.jsx
import React from 'react';
import { Alert, Button, Container } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedo, faBug } from '@fortawesome/free-solid-svg-icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log to your error tracking service here
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Optional: send to Sentry, LogRocket, etc.
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container className="py-5 text-center">
          <Alert variant="danger" className="p-4 shadow">
            <h4 className="mb-3">
              <FontAwesomeIcon icon={faBug} className="me-2" />
              Something went wrong
            </h4>

            <p className="mb-4">
              {import.meta.env.NODE_ENV === 'development'
                ? this.state.error?.message
                : "We're sorry — something broke on our end."}
            </p>

            <div className="d-flex justify-content-center gap-3">
              <Button
                variant="outline-primary"
                onClick={() => window.location.reload()}
              >
                <FontAwesomeIcon icon={faRedo} className="me-2" />
                Reload Page
              </Button>

              <Button
                variant="outline-secondary"
                onClick={() => this.setState({ hasError: false })}
              >
                Try Again
              </Button>
            </div>

            {import.meta.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="mt-4 p-3 bg-dark text-danger rounded text-start" style={{ fontSize: '0.9rem' }}>
                {this.state.error.stack}
              </pre>
            )}
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;