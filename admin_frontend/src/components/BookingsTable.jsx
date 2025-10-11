import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Edit, Calendar, Eye } from 'lucide-react';
import { adminService } from '../services/adminService';
import BookingEditModal from './BookingEditModal';
import BookingViewModal from './BookingViewModal';

const BookingsTable = ({ onBookingAction }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedViewBooking, setSelectedViewBooking] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    user: 'all',
    experience: 'all'
  });

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await adminService.getAllBookings();
        if (response.success) {
          setBookings(response.data);
          setError(null);
        } else {
          setError(response.error);
        }
      } catch (err) {
        setError('Failed to load bookings');
        console.error('Bookings fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTravellerName = (traveler) => {
    if (!traveler) return 'N/A';
    if (traveler.firstName && traveler.lastName) {
      return `${traveler.firstName} ${traveler.lastName}`;
    }
    return traveler.email || 'N/A';
  };

  const getExperienceTitle = (experience) => {
    return experience?.title || 'N/A';
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return (
      <div className="flex items-center text-sm text-gray-900">
        <Calendar className="w-4 h-4 mr-1" />
        <div className="flex items-center">
          <span className="font-medium">
            {date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
          <span className="font-medium text-gray-500 ml-2">
            {date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
          </span>
        </div>
      </div>
    );
  };

  const getFilteredBookings = () => {
    let filtered = bookings;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.id.toString().includes(searchTerm) ||
        booking.traveler?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.traveler?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.traveler?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.experience?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        switch (filters.dateRange) {
          case 'last_7_days':
            return bookingDate >= sevenDaysAgo;
          case 'last_30_days':
            return bookingDate >= thirtyDaysAgo;
          case 'this_year':
            return bookingDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    // User filter
    if (filters.user !== 'all') {
      filtered = filtered.filter(booking => {
        const userName = `${booking.traveler?.firstName || ''} ${booking.traveler?.lastName || ''}`.toLowerCase();
        return userName.includes(filters.user.toLowerCase());
      });
    }

    // Experience filter
    if (filters.experience !== 'all') {
      filtered = filtered.filter(booking => {
        const experienceTitle = booking.experience?.title?.toLowerCase() || '';
        return experienceTitle.includes(filters.experience.toLowerCase());
      });
    }

    return filtered;
  };

  const filteredBookings = getFilteredBookings();

  // Sorting logic
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    if (sortConfig.key === 'id') {
      const aId = parseInt(a.id) || 0;
      const bId = parseInt(b.id) || 0;
      return sortConfig.direction === 'asc' ? aId - bId : bId - aId;
    }
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = sortedBookings.slice(startIndex, endIndex);

  const handlePageChange = (page) => { setCurrentPage(page); };
  const handlePrevPage = () => { if (currentPage > 1) { setCurrentPage(currentPage - 1); } };
  const handleNextPage = () => { if (currentPage < totalPages) { setCurrentPage(currentPage + 1); } };

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

  const handleEditBooking = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  const handleViewBooking = (booking) => {
    setSelectedViewBooking(booking);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedViewBooking(null);
  };

  const handleBookingUpdated = () => {
    // Refresh bookings data
    const fetchBookings = async () => {
      try {
        const response = await adminService.getAllBookings();
        if (response.success) {
          setBookings(response.data);
        }
      } catch (err) {
        console.error('Error refreshing bookings:', err);
      }
    };
    fetchBookings();
    
    // Notify parent component to refresh metrics
    if (onBookingAction) {
      onBookingAction();
    }
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-500">
        Loading bookings...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">All Bookings</h3>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Date:</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="this_year">This Year</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">User:</label>
              <input
                type="text"
                placeholder="User name..."
                value={filters.user === 'all' ? '' : filters.user}
                onChange={(e) => handleFilterChange('user', e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Experience:</label>
              <input
                type="text"
                placeholder="Experience..."
                value={filters.experience === 'all' ? '' : filters.experience}
                onChange={(e) => handleFilterChange('experience', e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Traveller</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentBookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{getTravellerName(booking.traveler)}</div>
                  <div className="text-sm text-gray-500">{booking.traveler?.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getExperienceTitle(booking.experience)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatDateTime(booking.startDateTime)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatDateTime(booking.endDateTime)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatDateTime(booking.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.numberOfParticipants}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${booking.totalAmount ? booking.totalAmount.toFixed(2) : '0.00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewBooking(booking)}
                      className="text-green-600 hover:text-green-900 transition-colors"
                      title="View Booking Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditBooking(booking)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Edit booking"
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
      {sortedBookings.length === 0 && searchTerm && (
        <div className="px-6 py-4 text-center text-gray-500">
          No bookings found matching "{searchTerm}"
        </div>
      )}
      {sortedBookings.length === 0 && !searchTerm && !loading && (
        <div className="px-6 py-4 text-center text-gray-500">
          No bookings available.
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, sortedBookings.length)} of {sortedBookings.length} bookings
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

      {/* Booking Edit Modal */}
      <BookingEditModal
        booking={selectedBooking}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onBookingUpdated={handleBookingUpdated}
      />

      {/* Booking View Modal */}
      <BookingViewModal
        booking={selectedViewBooking}
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
      />
    </div>
  );
};

export default BookingsTable;