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
        return <Info className="w-8 h-8 text-primary-1" />;
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
        return 'bg-primary-1 hover:opacity-90';
      default:
        return 'bg-red-600 hover:bg-red-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutrals-6">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <h3 className="text-lg font-semibold text-neutrals-1">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutrals-4 hover:text-neutrals-2 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-neutrals-3 mb-6">{message}</p>
          
          {/* Text Area */}
          {showTextArea && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutrals-2 mb-2">
                {textAreaLabel}
              </label>
              <textarea
                value={textAreaValue}
                onChange={(e) => textAreaOnChange(e.target.value)}
                placeholder={textAreaPlaceholder}
                className="w-full px-3 py-2 border border-neutrals-7 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-1 focus:border-transparent resize-none"
                rows={4}
              />
            </div>
          )}
          
          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-neutrals-7 text-neutrals-2 rounded-lg hover:bg-neutrals-8 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${getConfirmButtonColor()}`}
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
