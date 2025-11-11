import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { experienceReportService } from '../../services/experienceReportService';
import { useAuth } from '../../contexts/AuthContext';

const REASONS = [
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
  { value: 'MISLEADING_DESCRIPTION', label: 'Misleading description' },
  { value: 'SAFETY_CONCERNS', label: 'Safety concerns' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'FRAUDULENT', label: 'Fraudulent' },
  { value: 'HARASSMENT_OR_ABUSE', label: 'Harassment or abuse' },
  { value: 'INAPPROPRIATE_IMAGES', label: 'Inappropriate images' },
  { value: 'FALSE_INFORMATION', label: 'False information' },
  { value: 'PRICING_ISSUES', label: 'Pricing issues' },
  { value: 'CANCELLATION_POLICY_ISSUES', label: 'Cancellation policy issues' },
  { value: 'POOR_SERVICE', label: 'Poor service' },
  { value: 'UNSAFE_CONDITIONS', label: 'Unsafe conditions' },
  { value: 'OTHER', label: 'Other' },
];

const ReportExperienceModal = ({ isOpen, onClose, experienceId, onSubmitted }) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showReasonTooltip, setShowReasonTooltip] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await experienceReportService.createReport({
        reporterUserId: user?.id || user?.userId,
        experienceId,
        reason,
        description,
      });
      setSuccess(true);
      setShowConfirmModal(false);
      // Keep success message visible for 3 seconds, then close and reset
      setTimeout(() => {
        setSuccess(false);
        // Call onSubmitted callback when actually closing
        if (onSubmitted) onSubmitted();
        onClose();
        // Reset form
        setReason('');
        setDescription('');
      }, 3000);
    } catch (e) {
      console.error('Error submitting report:', e);
      // Handle network errors and duplicate reports
      let errorMessage = 'We couldn\'t submit your report. Please try again later.';
      if (e.message) {
        // If the error message contains duplicate info or other specific errors, use it
        if (e.message.includes('already submitted') || e.message.includes('already reported')) {
          errorMessage = e.message;
        } else if (e.message.includes('network') || e.message.includes('fetch')) {
          errorMessage = 'We couldn\'t submit your report. Please check your connection and try again later.';
        } else if (e.message.includes('500') || e.message.includes('server')) {
          errorMessage = 'We couldn\'t submit your report. Please try again later.';
        } else {
          // For validation errors or other specific errors, show the actual message
          errorMessage = e.message;
        }
      }
      setError(errorMessage);
      setShowConfirmModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClick = () => {
    if (!reason) {
      setShowReasonTooltip(true);
      setTimeout(() => setShowReasonTooltip(false), 3000);
      return;
    }
    setShowConfirmModal(true);
  };

  const getReasonLabel = () => {
    const selectedReason = REASONS.find(r => r.value === reason);
    return selectedReason ? selectedReason.label : reason;
  };

  if (!isOpen) return null;

  return (
    <>
      {createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999]"
            onClick={success ? undefined : onClose}
          />
          
          {/* Modal Content */}
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg pointer-events-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-neutrals-6">
                <h3 className="text-lg font-semibold text-neutrals-1">Report Experience</h3>
                {!success && (
                  <button onClick={onClose} className="text-neutrals-4 hover:text-neutrals-2" aria-label="Close">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="p-4 space-y-4">
                {success ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                      <div className="flex justify-center mb-3">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-green-800 mb-2">Thank You!</h3>
                      <p className="text-green-700">
                        Thank you for submitting this report. We appreciate your help keeping the platform safe.
                      </p>
                      <p className="text-sm text-green-600 mt-3">
                        Your report will be reviewed by our team and appropriate action will be taken.
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={() => {
                          setSuccess(false);
                          // Call onSubmitted callback when actually closing
                          if (onSubmitted) onSubmitted();
                          onClose();
                          setReason('');
                          setDescription('');
                        }}
                        className="px-6 py-2 bg-primary-1 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                        {error}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-neutrals-2 mb-1">
                        Reason <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          className={`w-full border rounded-lg px-3 py-2 text-sm ${
                            showReasonTooltip ? 'border-red-500' : 'border-neutrals-6'
                          }`}
                          value={reason}
                          onChange={(e) => {
                            setReason(e.target.value);
                            setShowReasonTooltip(false);
                          }}
                          disabled={loading}
                        >
                          <option value="">Please select reason</option>
                          {REASONS.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                        {showReasonTooltip && (
                          <div className="absolute left-0 top-full mt-1 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 z-10 flex items-center gap-2 shadow-md">
                            <AlertCircle className="w-4 h-4" />
                            Please select a reason to continue
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutrals-2 mb-1">Description (optional)</label>
                      <textarea
                        className="w-full border border-neutrals-6 rounded-lg px-3 py-2 text-sm min-h-[100px]"
                        placeholder="Describe what happened..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </>
                )}
              </div>

              {!success && (
                <div className="p-4 border-t border-neutrals-6 flex items-center justify-end gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-sm bg-neutrals-7 text-neutrals-2 hover:bg-neutrals-6"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <div className="relative">
                    <button
                      onClick={handleSubmitClick}
                      className="px-4 py-2 rounded-lg text-sm bg-primary-1 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                      title={!reason ? 'Please select a reason to continue' : ''}
                    >
                      Submit Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && createPortal(
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999999]"
            onClick={() => setShowConfirmModal(false)}
          />
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="bg-white rounded-2xl shadow-xl w-full max-w-md pointer-events-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-neutrals-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-1/10 rounded-full flex items-center justify-center">
                    <Info className="w-5 h-5 text-primary-1" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutrals-1">Submit Experience Report</h3>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="text-neutrals-4 hover:text-neutrals-2 transition-colors"
                  disabled={loading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-neutrals-3 mb-6">
                  Are you sure you want to submit this experience report? 
                  <br />
                  <strong>Reason:</strong> {getReasonLabel()}
                  <br />
                  We will review your report and take appropriate action.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 px-4 py-2 border border-neutrals-7 text-neutrals-2 rounded-lg hover:bg-neutrals-8 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-primary-1 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default ReportExperienceModal;

