import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { adminService } from '../services/adminService';
import ConfirmationModal from './ConfirmationModal';

const ExperienceEditModal = ({ experience, isOpen, onClose, onExperienceUpdated }) => {
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    country: '',
    duration: '',
    participantsAllowed: '',
    category: '',
    price: '',
    status: 'ACTIVE'
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
    if (experience) {
      setFormData({
        title: experience.title || '',
        location: experience.location || '',
        country: experience.country || '',
        duration: experience.duration || '',
        participantsAllowed: experience.participantsAllowed || '',
        category: experience.category || '',
        price: experience.price || '',
        status: experience.status || 'ACTIVE'
      });
    }
  }, [experience]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Send notification to the experience owner (guide) about changes
   * @param {string} notificationType - Type of notification (UPDATE, SUSPEND, STATUS_CHANGE)
   * @param {string} actionDescription - Description of the action taken
   */
  const sendExperienceUpdateNotification = async (notificationType, actionDescription) => {
    try {
      console.log('Sending notification for experience:', experience.id);
      
      // Get the guide's user ID from the experience
      const guideUserId = experience.guide?.id;
      
      if (!guideUserId) {
        console.warn('No guide user ID found for experience:', experience.id);
        return;
      }

      const notificationPayload = {
        title: 'Experience Updated by Admin',
        message: `Your experience "${experience.title}" has been ${actionDescription}. Please review the changes in your experience listings.`,
        userId: guideUserId,
        type: notificationType,
      };
      
      console.log('Notification payload:', notificationPayload);
      
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8080/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(notificationPayload),
      });
      
      console.log('Notification response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Notification error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Notification sent successfully:', data);
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't throw the error - we don't want notification failures to break the main flow
    }
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

  const handleConfirm = async () => {
    if (confirmationModal.action) {
      await confirmationModal.action();
    }
    setConfirmationModal({ isOpen: false, title: '', message: '', type: 'warning', action: null });
  };

  const handleSave = () => {
    showConfirmation(
      'Save Changes',
      'Are you sure you want to save these changes to the experience?',
      'info',
      async () => {
        try {
          setLoading(true);
          setError(null);
          
          // Convert string values to appropriate types
          const updateData = {
            ...formData,
            duration: parseFloat(formData.duration) || 0,
            participantsAllowed: parseInt(formData.participantsAllowed) || 1,
            price: parseFloat(formData.price) || 0
          };
          
          const response = await adminService.updateExperience(experience.id, updateData);
          
          if (response.success) {
            // Send notification to the guide about the update
            await sendExperienceUpdateNotification(
              'EXPERIENCE_UPDATE',
              'updated with new information'
            );
            
            setSuccess('Experience updated successfully!');
            onExperienceUpdated(response.data);
            setTimeout(() => {
              onClose();
              setSuccess(null);
            }, 1500);
          } else {
            setError(response.error);
          }
        } catch (err) {
          setError('Failed to update experience');
          console.error('Update experience error:', err);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleSuspend = () => {
    showConfirmation(
      'Suspend Experience',
      `Are you sure you want to suspend "${experience.title}"? This will prevent new bookings.`,
      'warning',
      async () => {
        try {
          setLoading(true);
          setError(null);
          
          const response = await adminService.suspendExperience(experience.id);
          
          if (response.success) {
            // Send notification to the guide about the suspension
            await sendExperienceUpdateNotification(
              'EXPERIENCE_SUSPENDED',
              'suspended by an administrator. No new bookings will be accepted until it is reactivated'
            );
            
            setSuccess('Experience suspended successfully!');
            onExperienceUpdated(response.data);
            setTimeout(() => {
              onClose();
              setSuccess(null);
            }, 1500);
          } else {
            setError(response.error);
          }
        } catch (err) {
          setError('Failed to suspend experience');
          console.error('Suspend experience error:', err);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleToggleStatus = () => {
    const action = formData.status === 'ACTIVE' ? 'deactivate' : 'activate';
    const newStatus = formData.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    showConfirmation(
      `${action === 'activate' ? 'Activate' : 'Deactivate'} Experience`,
      `Are you sure you want to ${action} "${experience.title}"?`,
      action === 'activate' ? 'success' : 'warning',
      async () => {
        try {
          setLoading(true);
          setError(null);
          
          const response = await adminService.updateExperienceStatus(experience.id, newStatus);
          
          if (response.success) {
            // Send notification to the guide about the status change
            await sendExperienceUpdateNotification(
              'EXPERIENCE_STATUS_CHANGE',
              `${action}d by an administrator`
            );
            
            setSuccess(`Experience ${action}d successfully!`);
            onExperienceUpdated(response.data);
            setTimeout(() => {
              onClose();
              setSuccess(null);
            }, 1500);
          } else {
            setError(response.error);
          }
        } catch (err) {
          setError(`Failed to ${action} experience`);
          console.error(`${action} experience error:`, err);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleDelete = () => {
    showConfirmation(
      'Delete Experience',
      `Are you sure you want to permanently delete "${experience.title}"? This action cannot be undone. Note: Experiences with existing bookings cannot be deleted.`,
      'warning',
      async () => {
        try {
          setLoading(true);
          setError(null);
          
          const response = await adminService.deleteExperience(experience.id);
          
          if (response.success) {
            setSuccess('Experience deleted successfully!');
            onExperienceUpdated(null); // Signal that experience was deleted
            setTimeout(() => {
              onClose();
              setSuccess(null);
            }, 1500);
          } else {
            setError(response.error);
          }
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to delete experience');
          console.error('Delete experience error:', err);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  if (!isOpen || !experience) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Experience</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
              {/* Success/Error Messages */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Warning for experiences with bookings */}
              {experience.bookingCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This experience has {experience.bookingCount} booking(s) and cannot be deleted. 
                    You can suspend it instead to prevent new bookings.
                  </p>
                </div>
              )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (Hours)
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Participants
              </label>
              <input
                type="number"
                name="participantsAllowed"
                value={formData.participantsAllowed}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                <option value="GUIDED_TOUR">Guided Tour</option>
                <option value="DAYTRIP">Day Trip</option>
                <option value="ADVENTURE">Adventure</option>
                <option value="WATER_ACTIVITY">Water Activity</option>
                <option value="WORKSHOP">Workshop</option>
                <option value="CULTURAL">Cultural</option>
                <option value="FOOD_DRINK">Food & Drink</option>
                <option value="NATURE">Nature</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                formData.status === 'ACTIVE' 
                  ? 'bg-green-100 text-green-800' 
                  : formData.status === 'INACTIVE'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {formData.status === 'ACTIVE' ? 'Active' : formData.status === 'INACTIVE' ? 'Inactive' : 'Suspended'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 space-y-3">
          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleToggleStatus}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                formData.status === 'ACTIVE' 
                  ? 'bg-gray-600 hover:bg-gray-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {formData.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </button>
            
            <button
              onClick={handleSuspend}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Suspend
            </button>
            
            <button
              onClick={handleDelete}
              disabled={loading || (experience.bookingCount > 0)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                experience.bookingCount > 0
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={experience.bookingCount > 0 ? 'Cannot delete experience with existing bookings' : 'Delete experience'}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, title: '', message: '', type: 'warning', action: null })}
        onConfirm={handleConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        loading={loading}
      />
    </div>
  );
};

export default ExperienceEditModal;
