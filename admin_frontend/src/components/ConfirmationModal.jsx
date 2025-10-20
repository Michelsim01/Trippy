import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "warning", // warning, success, info
  loading = false,
  showTextArea = false,
  textAreaLabel = "",
  textAreaValue = "",
  textAreaOnChange = () => {},
  textAreaPlaceholder = "",
  confirmButtonClass = "",
  icon = null,
  iconColor = ""
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    if (icon) {
      const IconComponent = icon;
      return <IconComponent className={`w-8 h-8 ${iconColor}`} />;
    }
    
    switch (type) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'info':
        return <Info className="w-8 h-8 text-blue-600" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-yellow-600" />;
    }
  };

  const getConfirmButtonColor = () => {
    if (confirmButtonClass) {
      return confirmButtonClass;
    }
    
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700';
      default:
        return 'bg-red-600 hover:bg-red-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">{message}</p>
          
          {showTextArea && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {textAreaLabel}
              </label>
              <textarea
                value={textAreaValue}
                onChange={textAreaOnChange}
                placeholder={textAreaPlaceholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            {cancelText && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getConfirmButtonColor()}`}
            >
              {loading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;