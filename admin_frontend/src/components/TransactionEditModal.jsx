import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { adminService } from '../services/adminService';

const TransactionEditModal = ({ transaction, isOpen, onClose, onTransactionUpdated }) => {
  const [formData, setFormData] = useState({
    amount: '',
    status: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    action: null
  });

  useEffect(() => {
    if (transaction && isOpen) {
      setFormData({
        amount: transaction.amount || '',
        status: transaction.status || ''
      });
      setError(null);
      setSuccess(null);
    }
  }, [transaction, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showConfirmation = (title, message, type, action) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      type,
      action
    });
  };

  const handleSave = () => {
    showConfirmation(
      'Save Transaction Changes',
      'Are you sure you want to save these changes to the transaction? This will update the transaction amount and status.',
      'warning',
      async () => {
        try {
          setLoading(true);
          setError(null);
          setSuccess(null);

          const updateData = {
            amount: parseFloat(formData.amount),
            status: formData.status
          };

          const response = await adminService.updateTransaction(transaction.id, updateData);
          
          if (response.success) {
            setSuccess('Transaction updated successfully!');
            setTimeout(() => {
              onTransactionUpdated();
              onClose();
            }, 1500);
          } else {
            setError(response.error || 'Failed to update transaction');
          }
        } catch (err) {
          console.error('Error updating transaction:', err);
          setError(err.response?.data?.message || 'Failed to update transaction');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleDelete = () => {
    showConfirmation(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      'danger',
      async () => {
        try {
          setLoading(true);
          setError(null);
          setSuccess(null);

          const response = await adminService.deleteTransaction(transaction.id);
          
          if (response.success) {
            setSuccess('Transaction deleted successfully!');
            setTimeout(() => {
              onTransactionUpdated();
              onClose();
            }, 1500);
          } else {
            setError(response.error || 'Failed to delete transaction');
          }
        } catch (err) {
          console.error('Error deleting transaction:', err);
          setError(err.response?.data?.message || 'Failed to delete transaction');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleConfirmAction = () => {
    if (confirmationModal.action) {
      confirmationModal.action();
    }
    setConfirmationModal({ isOpen: false, title: '', message: '', type: 'warning', action: null });
  };

  const handleCancelConfirmation = () => {
    setConfirmationModal({ isOpen: false, title: '', message: '', type: 'warning', action: null });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'PAYMENT': return 'bg-blue-100 text-blue-800';
      case 'REFUND': return 'bg-red-100 text-red-800';
      case 'PAYOUT': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Edit Transaction</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Success Message */}
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <div className="w-5 h-5 text-green-500 mr-2">✓</div>
                  <span className="text-green-700">{success}</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <div className="w-5 h-5 text-red-500 mr-2">⚠</div>
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Transaction Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Transaction Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Transaction ID:</span>
                  <span className="ml-2 font-medium">{transaction.id}</span>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(transaction.type)}`}>
                    {transaction.type}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Booking ID:</span>
                  <span className="ml-2 font-medium">{transaction.bookingId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Experience:</span>
                  <span className="ml-2 font-medium">{transaction.experience || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">User:</span>
                  <span className="ml-2 font-medium">{transaction.user || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Platform Fee:</span>
                  <span className="ml-2 font-medium">${transaction.platformFee || '0'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>
                  <span className="ml-2 font-medium">{transaction.date || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Current Status:</span>
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Amount */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ($)
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Transaction
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={handleCancelConfirmation}
        onConfirm={handleConfirmAction}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText={confirmationModal.type === 'danger' ? 'Delete' : 'Confirm'}
        type={confirmationModal.type}
      />
    </>
  );
};

export default TransactionEditModal;
