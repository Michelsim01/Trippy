import React, { useState } from 'react';
import { X, CheckCircle, XCircle, FileText, Calendar, Mail, Phone, MapPin, User, AlertCircle } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

const KYCViewModal = ({ submission, onClose, onApprove, onDecline }) => {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineMessage, setDeclineMessage] = useState('');

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

  const handleApprove = () => {
    setShowApproveModal(true);
  };

  const handleDecline = () => {
    setShowDeclineModal(true);
  };

  const confirmApprove = () => {
    onApprove(submission.id);
    setShowApproveModal(false);
  };

  const confirmDecline = () => {
    onDecline(submission.id, declineMessage);
    setShowDeclineModal(false);
    setDeclineMessage('');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      NOT_STARTED: { color: 'bg-gray-100 text-gray-800', label: 'Not Started', icon: AlertCircle },
      PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review', icon: AlertCircle },
      APPROVED: { color: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle },
      REJECTED: { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {config.label}
      </span>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">KYC Document Review</h2>
              <p className="text-sm text-gray-600 mt-1">KYC Document ID: {submission.kycId || submission.id}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status and Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Guide Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium">{submission.userName}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{submission.userEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Submission Date</p>
                        <p className="font-medium">{formatDate(submission.submittedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Current Status</h3>
                  <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                    {getStatusBadge(submission.status)}
                  </div>
                </div>

                {/* Document Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Document Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Document Type</p>
                        <p className="font-medium">{submission.docType || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Document Side</p>
                        <p className="font-medium">{submission.docSide || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500">Reviewed At</p>
                        <p className="font-medium">{submission.reviewedAt ? formatDate(submission.reviewedAt) : 'Not reviewed'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Document</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* KYC Document */}
                {submission.fileUrl && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <FileText className="w-5 h-5 text-blue-600 mr-2" />
                      <h4 className="font-medium text-gray-900">{submission.docType || 'Document'}</h4>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Type: {submission.docType || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Side: {submission.docSide || 'N/A'}</p>
                      <div className="mt-2">
                        <img
                          src={`http://localhost:8080${submission.fileUrl}`}
                          alt={`${submission.docType || 'Document'} - ${submission.docSide || 'Front'}`}
                          className="w-full h-32 object-cover rounded border"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="w-full h-32 bg-gray-100 rounded border flex items-center justify-center text-gray-500 text-sm" style={{display: 'none'}}>
                          Image not available
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            {submission.notes && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Additional Notes</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{submission.notes}</p>
                </div>
              </div>
            )}

            {/* Rejection Reason */}
            {submission.status === 'REJECTED' && submission.rejectionReason && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Rejection Reason</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">{submission.rejectionReason}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
            
            {submission.status === 'PENDING' && (
              <>
                <button
                  onClick={handleDecline}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Approve
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={confirmApprove}
        title="Approve KYC Document"
        message={`Are you sure you want to approve ${submission.userName}'s KYC document? This will verify their account and allow them to list tours.`}
        confirmText="Approve"
        confirmButtonClass="bg-green-600 hover:bg-green-700"
        icon={CheckCircle}
        iconColor="text-green-600"
      />

      <ConfirmationModal
        isOpen={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        onConfirm={confirmDecline}
        title="Reject KYC Document"
        message={`Are you sure you want to reject ${submission.userName}'s KYC document?`}
        confirmText="Reject"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        icon={XCircle}
        iconColor="text-red-600"
        showTextArea={true}
        textAreaLabel="Reason for rejection (optional)"
        textAreaValue={declineMessage}
        textAreaOnChange={setDeclineMessage}
        textAreaPlaceholder="Please provide a reason for rejecting this document..."
      />
    </>
  );
};

export default KYCViewModal;
