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
            // window.location.href = '/500';  // Comment this out
            console.error('Error boundary triggered:', this.state.error);
            return <div>Error occurred: {this.state.error?.message}</div>;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
