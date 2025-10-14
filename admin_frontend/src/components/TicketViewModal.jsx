import React, { useState } from 'react';
import { X, Calendar, User, Mail, Tag, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { adminService } from '../services/adminService';
import ConfirmationModal from './ConfirmationModal';

const TicketViewModal = ({ ticket, isOpen, onClose, onTicketAction }) => {
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    action: null
  });
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !ticket) return null;

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

  const handleTakeTicket = () => {
    showConfirmation(
      'Take Ticket',
      `Are you sure you want to take ticket #${ticket.id}? This will assign the ticket to you and change its status to "In Progress".`,
      'info',
      async () => {
        try {
          setErrorMessage('');
          const response = await adminService.takeTicket(ticket.id);
          if (response.success) {
            // Refresh the parent component to update the ticket list
            if (onTicketAction) {
              onTicketAction();
            }
            onClose();
          } else {
            setErrorMessage(`Failed to take ticket: ${response.error}`);
          }
        } catch (error) {
          console.error('Error taking ticket:', error);
          setErrorMessage('Error taking ticket. Please try again.');
        }
      }
    );
  };

  const handleResolveTicket = () => {
    showConfirmation(
      'Resolve Ticket',
      `Are you sure you want to resolve ticket #${ticket.id}? This will mark the ticket as resolved and close it.`,
      'success',
      async () => {
        try {
          setErrorMessage('');
          const response = await adminService.updateTicketStatus(ticket.id, 'RESOLVED');
          if (response.success) {
            // Refresh the parent component to update the ticket list
            if (onTicketAction) {
              onTicketAction();
            }
            onClose();
          } else {
            setErrorMessage(`Failed to resolve ticket: ${response.error}`);
          }
        } catch (error) {
          console.error('Error resolving ticket:', error);
          setErrorMessage('Error resolving ticket. Please try again.');
        }
      }
    );
  };

  const handleDeleteTicket = () => {
    showConfirmation(
      'Delete Ticket',
      `Are you sure you want to delete ticket #${ticket.id}? This action cannot be undone.`,
      'danger',
      async () => {
        try {
          setErrorMessage('');
          const response = await adminService.deleteTicket(ticket.id);
          if (response.success) {
            // Refresh the parent component to update the ticket list
            if (onTicketAction) {
              onTicketAction();
            }
            onClose();
          } else {
            setErrorMessage(`Failed to delete ticket: ${response.error}`);
          }
        } catch (error) {
          console.error('Error deleting ticket:', error);
          setErrorMessage('Error deleting ticket. Please try again.');
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

  const formatTicketType = (ticketType) => {
    return ticketType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTicketTypeColor = (ticketType) => {
    switch (ticketType) {
      case 'SUSPENSION_APPEAL':
        return 'bg-red-100 text-red-800';
      case 'TECHNICAL_SUPPORT':
        return 'bg-purple-100 text-purple-800';
      case 'BOOKING_HELP':
        return 'bg-blue-100 text-blue-800';
      case 'GENERAL_INQUIRY':
        return 'bg-gray-100 text-gray-800';
      case 'PARTNERSHIP':
        return 'bg-green-100 text-green-800';
      case 'FEEDBACK':
        return 'bg-yellow-100 text-yellow-800';
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
          <h2 className="text-xl font-semibold text-gray-900">Ticket Details</h2>
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
          {/* Ticket ID and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-500">Ticket ID:</span>
              <span className="text-lg font-semibold text-gray-900">#{ticket.id}</span>
            </div>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
              {ticket.status.replace('_', ' ')}
            </span>
          </div>

          {/* User Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <User className="w-4 h-4 mr-2" />
              User Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-500">Name:</span>
                <span className="text-sm text-gray-900">{ticket.userName || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{ticket.userEmail}</span>
                <span className="text-xs text-gray-500">(Account Email)</span>
              </div>
              {ticket.formEmail && ticket.formEmail !== ticket.userEmail && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{ticket.formEmail}</span>
                  <span className="text-xs text-gray-500">(Form Email)</span>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Type */}
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-500">Type:</span>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTicketTypeColor(ticket.ticketType)}`}>
              {formatTicketType(ticket.ticketType)}
            </span>
          </div>

          {/* Created Date */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-500">Created:</span>
            <span className="text-sm text-gray-900">{formatDate(ticket.createdAt)}</span>
          </div>

          {/* Admin Assignment Information */}
          {(ticket.status === 'IN_PROGRESS' || ticket.status === 'RESOLVED') && ticket.assignedTo && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Assigned Admin
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-500">Admin ID:</span>
                  <span className="text-sm text-gray-900">{ticket.assignedTo}</span>
                </div>
                {ticket.assignedAdminName && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">Name:</span>
                    <span className="text-sm text-gray-900">{ticket.assignedAdminName}</span>
                  </div>
                )}
                {ticket.assignedAdminEmail && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{ticket.assignedAdminEmail}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-500">Action:</span>
                  <span className="text-sm text-gray-900">
                    {ticket.status === 'IN_PROGRESS' ? 'Taken up' : 'Resolved'}
                  </span>
                </div>
              </div>
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
                {ticket.description || 'No description provided'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          <div className="flex space-x-2">
            {/* Take Ticket Button - Only show for OPEN tickets */}
            {ticket.status === 'OPEN' && (
              <button
                onClick={handleTakeTicket}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Take Ticket</span>
              </button>
            )}
            
            {/* Resolve Button - Only show for IN_PROGRESS tickets */}
            {ticket.status === 'IN_PROGRESS' && (
              <button
                onClick={handleResolveTicket}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Resolve</span>
              </button>
            )}
            
            {/* Delete Button - Always show */}
            <button
              onClick={handleDeleteTicket}
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

export default TicketViewModal;
