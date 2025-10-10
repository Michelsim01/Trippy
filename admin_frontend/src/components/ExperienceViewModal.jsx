import React from 'react';
import { X, MapPin, Clock, Users, Star, DollarSign, Calendar, User } from 'lucide-react';

const ExperienceViewModal = ({ experience, isOpen, onClose }) => {
  if (!isOpen || !experience) return null;

  const getInitials = (firstName, lastName) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'SUSPENDED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'ADVENTURE': return 'bg-red-100 text-red-800';
      case 'CULTURAL': return 'bg-blue-100 text-blue-800';
      case 'NATURE': return 'bg-green-100 text-green-800';
      case 'FOOD': return 'bg-yellow-100 text-yellow-800';
      case 'RELAXATION': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Experience Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Experience Header */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{experience.title}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{experience.location}, {experience.country}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{experience.duration} hours</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>Max {experience.participantsAllowed} participants</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Experience Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">Experience Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Experience ID</p>
                    <p className="text-sm font-medium text-gray-900">#{experience.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(experience.category)}`}>
                      {experience.category}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Price</p>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{experience.price}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(experience.status)}`}>
                      {experience.status === 'ACTIVE' ? 'Active' : experience.status === 'INACTIVE' ? 'Inactive' : 'Suspended'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Guide Information */}
              {experience.guide && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">Tour Guide</h4>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {getInitials(experience.guide.firstName, experience.guide.lastName)}
                      </span>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">
                        {experience.guide.firstName} {experience.guide.lastName}
                      </h5>
                      <p className="text-sm text-gray-600">{experience.guide.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">Statistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-lg font-semibold text-gray-900">{experience.averageRating || 'N/A'}</span>
                    </div>
                    <p className="text-xs text-gray-500">Average Rating</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 mb-1">{experience.reviewCount || 0}</div>
                    <p className="text-xs text-gray-500">Reviews</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 mb-1">{experience.bookingCount || 0}</div>
                    <p className="text-xs text-gray-500">Bookings</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              {/* Location Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">Location</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">City</p>
                    <p className="text-sm font-medium text-gray-900">{experience.location}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Country</p>
                    <p className="text-sm font-medium text-gray-900">{experience.country}</p>
                  </div>
                </div>
              </div>

              {/* Experience Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">Details</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{experience.duration} hours</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Max Participants</p>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{experience.participantsAllowed}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">Pricing</h4>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    <span className="text-2xl font-bold text-gray-900">{experience.price}</span>
                  </div>
                  <p className="text-xs text-gray-500">Per person</p>
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

export default ExperienceViewModal;
