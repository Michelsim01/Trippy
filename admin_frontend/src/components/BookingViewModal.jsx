import React from 'react';
import { X, User, Calendar, MapPin, Clock, Users, DollarSign, CreditCard } from 'lucide-react';

const BookingViewModal = ({ booking, isOpen, onClose }) => {
  if (!isOpen || !booking) return null;

  const getInitials = (firstName, lastName) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last;
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const startDateTime = formatDateTime(booking.startDateTime);
  const endDateTime = formatDateTime(booking.endDateTime);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Booking Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Booking Header */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking #{booking.id}</h3>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                {booking.status}
              </span>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Booked on {formatDateTime(booking.createdAt).date}</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Booking Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Experience Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">Experience Details</h4>
                <div className="space-y-3">
                  <div>
                    <h5 className="text-lg font-semibold text-gray-900">{booking.experience?.title || 'N/A'}</h5>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>Location</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Experience ID</p>
                      <p className="text-sm font-medium text-gray-900">#{booking.experience?.id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Participants</p>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{booking.numberOfParticipants}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">Schedule</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Start Date & Time</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{startDateTime.date}</p>
                        <p className="text-xs text-gray-500">{startDateTime.time}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">End Date & Time</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{endDateTime.date}</p>
                        <p className="text-xs text-gray-500">{endDateTime.time}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Traveller Information */}
              {booking.traveler && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">Traveller</h4>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {getInitials(booking.traveler.firstName, booking.traveler.lastName)}
                      </span>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">
                        {booking.traveler.firstName} {booking.traveler.lastName}
                      </h5>
                      <p className="text-sm text-gray-600">{booking.traveler.email}</p>
                      <p className="text-xs text-gray-500">ID: #{booking.traveler.id}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Financial & Status */}
            <div className="space-y-6">
              {/* Financial Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">Financial Details</h4>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <DollarSign className="w-6 h-6 text-green-600" />
                      <span className="text-2xl font-bold text-gray-900">
                        {booking.totalAmount ? booking.totalAmount.toFixed(2) : '0.00'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Total Amount</p>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Participants</span>
                      <span className="font-medium">{booking.numberOfParticipants}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">Status</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Current Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Booking Date</p>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{formatDateTime(booking.createdAt).date}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">Quick Info</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Booking ID</span>
                    <span className="font-medium">#{booking.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Participants</span>
                    <span className="font-medium">{booking.numberOfParticipants}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Amount</span>
                    <span className="font-medium">${booking.totalAmount ? booking.totalAmount.toFixed(2) : '0.00'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingViewModal;
