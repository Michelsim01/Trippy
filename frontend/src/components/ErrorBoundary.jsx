import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error for debugging
        console.error('Error caught by boundary:', error, errorInfo);
        
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Optionally send error to logging service
        // logErrorToService(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // Redirect to server error page
            window.location.href = '/500';
            return null;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
