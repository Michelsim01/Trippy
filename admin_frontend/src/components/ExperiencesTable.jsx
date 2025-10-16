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
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    guide: 'all'
  });


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

  const getFilteredExperiences = () => {
    let filtered = experiences;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(experience => 
        experience.id.toString().includes(searchTerm) ||
        experience.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        experience.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        experience.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(experience => experience.category === filters.category);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(experience => experience.status === filters.status);
    }

    // Guide filter
    if (filters.guide !== 'all') {
      filtered = filtered.filter(experience => {
        const guideName = `${experience.guide?.firstName || ''} ${experience.guide?.lastName || ''}`.toLowerCase();
        return guideName.includes(filters.guide.toLowerCase());
      });
    }

    // Price range filter
    if (filters.priceRange !== 'all') {
      filtered = filtered.filter(experience => {
        const price = parseFloat(experience.price) || 0;
        switch (filters.priceRange) {
          case 'under_50':
            return price < 50;
          case '50_100':
            return price >= 50 && price <= 100;
          case '100_200':
            return price >= 100 && price <= 200;
          case 'over_200':
            return price > 200;
          default:
            return true;
        }
      });
    }

    // Sort by created date (latest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA; // Latest first
    });

    return filtered;
  };

  const filteredExperiences = getFilteredExperiences();

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

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
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
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">All Experiences</h3>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Category:</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="ADVENTURE">Adventure</option>
                <option value="DAYTRIP">Day Trip</option>
                <option value="GUIDED_TOUR">Guided Tour</option>
                <option value="WATER_ACTIVITY">Water Activity</option>
                <option value="WORKSHOP">Workshop</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Guide:</label>
              <input
                type="text"
                placeholder="Guide name..."
                value={filters.guide === 'all' ? '' : filters.guide}
                onChange={(e) => handleFilterChange('guide', e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, title or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="w-16 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center space-x-1">
                  <span>ID</span>
                  {getSortIcon('id')}
                </div>
              </th>
              <th className="w-80 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience Details</th>
              <th className="w-48 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guide</th>
              <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
              <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
              <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentExperiences.map((exp) => (
              <tr key={exp.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 text-sm text-gray-900">
                  {exp.id}
                </td>
                <td className="px-4 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 truncate" title={exp.title}>{exp.title}</div>
                    <div className="text-xs text-gray-500 mt-1 space-y-1">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{exp.location}, {exp.country}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>{exp.duration}h</span>
                        <UsersIcon className="w-3 h-3 ml-2 flex-shrink-0" />
                        <span>Max {exp.participantsAllowed}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-gray-700">
                        {exp.guide ? `${exp.guide.firstName?.charAt(0) || ''}${exp.guide.lastName?.charAt(0) || ''}` : 'N/A'}
                      </span>
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate" title={exp.guide ? `${exp.guide.firstName} ${exp.guide.lastName}` : 'No Guide'}>
                        {exp.guide ? `${exp.guide.firstName} ${exp.guide.lastName}` : 'No Guide'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(exp.category)}`}>
                    {exp.category}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 text-center">${exp.price}</td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-900">{exp.averageRating ? exp.averageRating.toFixed(1) : 'N/A'}</div>
                  <div className="text-xs text-gray-500">{exp.reviewCount || 0}</div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 text-center">{exp.bookingCount || 0}</td>
                <td className="px-4 py-4">
                  <div className="text-xs text-gray-900">
                    <div className="font-medium">
                      {exp.createdAt ? new Date(exp.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'N/A'}
                    </div>
                    <div className="text-gray-500">
                      {exp.createdAt ? new Date(exp.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      }) : ''}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(exp.status)}`}>
                    {exp.status === 'ACTIVE' ? 'Active' : exp.status === 'INACTIVE' ? 'Inactive' : 'Suspended'}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm font-medium">
                  <div className="flex items-center space-x-1">
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
