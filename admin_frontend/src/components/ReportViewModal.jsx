import React, { useState } from 'react';
import { X, Calendar, User, Mail, Tag, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { adminService } from '../services/adminService';
import ConfirmationModal from './ConfirmationModal';

const ReportViewModal = ({ report, isOpen, onClose, onReportAction }) => {
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    action: null
  });
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !report) return null;

  const showConfirmation = (title, message, type, action) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      type,
      action
    });
  };

  const handleConfirmAction = async () => {
    if (confirmationModal.action) {
      await confirmationModal.action();
    }
    setConfirmationModal({ isOpen: false, title: '', message: '', type: 'warning', action: null });
  };

  const handleCancelAction = () => {
    setConfirmationModal({ isOpen: false, title: '', message: '', type: 'warning', action: null });
  };

  const handleResolveReport = () => {
    showConfirmation(
      'Resolve Report',
      `Are you sure you want to resolve report #${report.reportId}? This will mark the report as resolved.`,
      'success',
      async () => {
        try {
          setErrorMessage('');
          const response = await adminService.updateReportStatus(report.reportId, 'RESOLVED');
          if (response.success) {
            if (onReportAction) {
              onReportAction();
            }
            onClose();
          } else {
            setErrorMessage(`Failed to resolve report: ${response.error}`);
          }
        } catch (error) {
          console.error('Error resolving report:', error);
          setErrorMessage('Error resolving report. Please try again.');
        }
      }
    );
  };

  const handleDismissReport = () => {
    showConfirmation(
      'Dismiss Report',
      `Are you sure you want to dismiss report #${report.reportId}? This will mark the report as dismissed.`,
      'info',
      async () => {
        try {
          setErrorMessage('');
          const response = await adminService.updateReportStatus(report.reportId, 'DISMISSED');
          if (response.success) {
            if (onReportAction) {
              onReportAction();
            }
            onClose();
          } else {
            setErrorMessage(`Failed to dismiss report: ${response.error}`);
          }
        } catch (error) {
          console.error('Error dismissing report:', error);
          setErrorMessage('Error dismissing report. Please try again.');
        }
      }
    );
  };

  const handleDeleteReport = () => {
    showConfirmation(
      'Delete Report',
      `Are you sure you want to delete report #${report.reportId}? This action cannot be undone.`,
      'danger',
      async () => {
        try {
          setErrorMessage('');
          const response = await adminService.deleteReport(report.reportId);
          if (response.success) {
            if (onReportAction) {
              onReportAction();
            }
            onClose();
          } else {
            setErrorMessage(`Failed to delete report: ${response.error}`);
          }
        } catch (error) {
          console.error('Error deleting report:', error);
          setErrorMessage('Error deleting report. Please try again.');
        }
      }
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatReason = (reason) => {
    return reason.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'DISMISSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReasonColor = (reason) => {
    switch (reason) {
      case 'INAPPROPRIATE_NAME':
        return 'bg-red-100 text-red-800';
      case 'SPAM_OR_SCAM':
        return 'bg-orange-100 text-orange-800';
      case 'FRAUDULENT_ACTIVITY':
        return 'bg-red-100 text-red-800';
      case 'HARASSMENT_OR_ABUSE':
        return 'bg-purple-100 text-purple-800';
      case 'HATE_SPEECH':
        return 'bg-pink-100 text-pink-800';
      case 'IMPERSONATION':
        return 'bg-indigo-100 text-indigo-800';
      case 'INAPPROPRIATE_CONTENT':
        return 'bg-yellow-100 text-yellow-800';
      case 'UNDERAGE_USER':
        return 'bg-blue-100 text-blue-800';
      case 'OTHER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Report Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Report ID and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-500">Report ID:</span>
              <span className="text-lg font-semibold text-gray-900">#{report.reportId}</span>
            </div>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(report.status)}`}>
              {report.status.replace('_', ' ')}
            </span>
          </div>

          {/* Reporter Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Reporter Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-500">Name:</span>
                <span className="text-sm text-gray-900">{report.reporterName || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{report.reporterEmail || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Reported User Information */}
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Reported User Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-500">Name:</span>
                <span className="text-sm text-gray-900">{report.reportedUserName || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{report.reportedUserEmail || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Report Reason */}
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-500">Reason:</span>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getReasonColor(report.reason)}`}>
              {formatReason(report.reason)}
            </span>
          </div>

          {/* Created Date */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-500">Created:</span>
            <span className="text-sm text-gray-900">{formatDate(report.createdAt)}</span>
          </div>

          {/* Updated Date */}
          {report.updatedAt && report.updatedAt !== report.createdAt && (
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-500">Last Updated:</span>
              <span className="text-sm text-gray-900">{formatDate(report.updatedAt)}</span>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Description
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                {report.description || 'No description provided'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          <div className="flex space-x-2">
            {/* Resolve Button - Only show for OPEN or IN_PROGRESS reports */}
            {(report.status === 'OPEN' || report.status === 'IN_PROGRESS') && (
              <button
                onClick={handleResolveReport}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Resolve</span>
              </button>
            )}
            
            {/* Dismiss Button - Only show for OPEN reports */}
            {report.status === 'OPEN' && (
              <button
                onClick={handleDismissReport}
                className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Dismiss</span>
              </button>
            )}
            
            {/* Delete Button - Always show */}
            <button
              onClick={handleDeleteReport}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    {/* Confirmation Modal */}
    <ConfirmationModal
      isOpen={confirmationModal.isOpen}
      onClose={handleCancelAction}
      onConfirm={handleConfirmAction}
      title={confirmationModal.title}
      message={confirmationModal.message}
      confirmText={confirmationModal.type === 'danger' ? 'Delete' : 'Confirm'}
      type={confirmationModal.type}
    />
    </>
  );
};

export default ReportViewModal;

