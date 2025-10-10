import React, { useState, useEffect } from 'react';
import { Edit, Search, MapPin, Clock, Users as UsersIcon, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { adminService } from '../services/adminService';
import ExperienceEditModal from './ExperienceEditModal';
import ExperienceViewModal from './ExperienceViewModal';

const ExperiencesTable = ({ onExperienceAction }) => {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedViewExperience, setSelectedViewExperience] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);


  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        setLoading(true);
        const response = await adminService.getAllExperiences();
        if (response.success) {
          setExperiences(response.data);
          setError(null);
        } else {
          setError(response.error);
        }
      } catch (err) {
        setError('Failed to load experiences');
        console.error('Experiences fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExperiences();
  }, []);

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
      case 'DAYTRIP': return 'bg-green-100 text-green-800';
      case 'FOOD': return 'bg-pink-100 text-pink-800';
      case 'ADVENTURE': return 'bg-purple-100 text-purple-800';
      case 'PHOTOGRAPHY': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const handleEditExperience = (experience) => {
    setSelectedExperience(experience);
    setIsModalOpen(true);
  };

  const handleExperienceAction = () => {
    // Notify parent component to refresh metrics
    if (onExperienceAction) {
      onExperienceAction();
    }
  };

  const handleExperienceUpdated = (updatedExperience) => {
    if (updatedExperience === null) {
      // Experience was deleted, remove from list
      setExperiences(prevExperiences => prevExperiences.filter(exp => exp.id !== selectedExperience.id));
    } else {
      // Experience was updated, update the list
      setExperiences(prevExperiences => 
        prevExperiences.map(exp => exp.id === updatedExperience.id ? updatedExperience : exp)
      );
    }
    
    // Notify parent component to refresh metrics
    if (onExperienceAction) {
      onExperienceAction();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedExperience(null);
  };

  const handleViewExperience = (experience) => {
    setSelectedViewExperience(experience);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedViewExperience(null);
  };

  const filteredExperiences = experiences.filter(exp => {
    const q = searchTerm.toLowerCase();
    return (
      exp.id?.toString().includes(q) ||
      exp.title.toLowerCase().includes(q) ||
      (exp.guide && `${exp.guide.firstName} ${exp.guide.lastName}`.toLowerCase().includes(q)) ||
      exp.category.toLowerCase().includes(q) ||
      exp.location.toLowerCase().includes(q) ||
      exp.country.toLowerCase().includes(q)
    );
  });

  // Sorting logic
  const sortedExperiences = [...filteredExperiences].sort((a, b) => {
    if (sortConfig.key === 'id') {
      const aId = parseInt(a.id) || 0;
      const bId = parseInt(b.id) || 0;
      return sortConfig.direction === 'asc' ? aId - bId : bId - aId;
    }
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedExperiences.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExperiences = sortedExperiences.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Experiences</h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Experiences</h3>
        </div>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading experiences</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">All Experiences</h3>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search experiences..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center space-x-1">
                  <span>ID</span>
                  {getSortIcon('id')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guide</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentExperiences.map((exp) => (
              <tr key={exp.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {exp.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{exp.title}</div>
                    <div className="text-sm text-gray-500 flex items-center space-x-1 mt-1">
                      <MapPin className="w-3 h-3" /> <span>{exp.location}, {exp.country}</span>
                      <Clock className="w-3 h-3 ml-2" /> <span>{exp.duration} Hours</span>
                      <UsersIcon className="w-3 h-3 ml-2" /> <span>Max {exp.participantsAllowed}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        {exp.guide ? `${exp.guide.firstName?.charAt(0) || ''}${exp.guide.lastName?.charAt(0) || ''}` : 'N/A'}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {exp.guide ? `${exp.guide.firstName} ${exp.guide.lastName}` : 'No Guide'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(exp.category)}`}>
                    {exp.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${exp.price}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{exp.averageRating ? exp.averageRating.toFixed(1) : 'N/A'}</div>
                  <div className="text-xs text-gray-500">{exp.reviewCount} Reviews</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exp.bookingCount}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(exp.status)}`}>
                    {exp.status === 'ACTIVE' ? 'Active' : exp.status === 'INACTIVE' ? 'Inactive' : 'Suspended'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewExperience(exp)}
                      className="text-green-600 hover:text-green-900 transition-colors"
                      title="View Experience Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditExperience(exp)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Edit Experience"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sortedExperiences.length === 0 && searchTerm && (
        <div className="px-6 py-4 text-center text-gray-500">
          No experiences found matching "{searchTerm}"
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, sortedExperiences.length)} of {sortedExperiences.length} experiences
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {(() => {
                const getVisiblePages = () => {
                  const delta = 2; // Number of pages to show on each side of current page
                  const range = [];
                  const rangeWithDots = [];

                  for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
                    range.push(i);
                  }

                  if (currentPage - delta > 2) {
                    rangeWithDots.push(1, '...');
                  } else {
                    rangeWithDots.push(1);
                  }

                  rangeWithDots.push(...range);

                  if (currentPage + delta < totalPages - 1) {
                    rangeWithDots.push('...', totalPages);
                  } else {
                    rangeWithDots.push(totalPages);
                  }

                  return rangeWithDots;
                };

                return getVisiblePages().map((page, index) => (
                  page === '...' ? (
                    <span key={`dots-${index}`} className="px-3 py-1 text-sm font-medium text-gray-500">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 text-sm font-medium rounded-md ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ));
              })()}
              
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Experience Edit Modal */}
      <ExperienceEditModal
        experience={selectedExperience}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onExperienceUpdated={handleExperienceUpdated}
      />

      {/* Experience View Modal */}
      <ExperienceViewModal
        experience={selectedViewExperience}
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
      />
    </div>
  );
};

export default ExperiencesTable;
