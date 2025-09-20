import React from 'react';

// This component is for testing error boundaries - can be removed in production
const ErrorTrigger = () => {
    const triggerError = () => {
        throw new Error('Test error for error boundary');
    };

    return (
        <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
            <h3 className="text-red-800 font-bold mb-2">Error Boundary Test</h3>
            <p className="text-red-600 text-sm mb-3">
                This component is for testing the error boundary. Click the button to trigger a JavaScript error.
            </p>
            <button
                onClick={triggerError}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
                Trigger Error
            </button>
        </div>
    );
};

export default ErrorTrigger;
