import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Edit, Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Eye, Trash2 } from 'lucide-react';
import { adminService } from '../services/adminService';
import TicketViewModal from './TicketViewModal';

const TicketsTable = forwardRef(({ onTicketAction }, ref) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [filters, setFilters] = useState({
    status: 'all',
    ticketType: 'all',
    dateRange: 'all'
  });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllTickets();

      if (response.success) {
        setTickets(response.data);
        setError(null);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to load tickets');
      console.error('Tickets fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Expose refreshTickets method to parent component
  useImperativeHandle(ref, () => ({
    refreshTickets: fetchTickets
  }));

  useEffect(() => {
    fetchTickets();
  }, []);


  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTicketTypeColor = (ticketType) => {
    switch (ticketType) {
      case 'SUSPENSION_APPEAL':
        return 'bg-red-100 text-red-800';
      case 'TECHNICAL_SUPPORT':
        return 'bg-purple-100 text-purple-800';
      case 'BOOKING_HELP':
        return 'bg-blue-100 text-blue-800';
      case 'GENERAL_INQUIRY':
        return 'bg-gray-100 text-gray-800';
      case 'PARTNERSHIP':
        return 'bg-green-100 text-green-800';
      case 'FEEDBACK':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return { datePart: 'N/A', timePart: '' };
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const timePart = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // Use 24-hour format
    });
    return { datePart, timePart };
  };

  const formatTicketType = (ticketType) => {
    return ticketType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };


  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedTicket(null);
  };

  const handleTicketAction = () => {
    // Refresh tickets when actions are performed
    fetchTickets();
    // Also call the parent's onTicketAction to refresh metrics
    if (onTicketAction) {
      onTicketAction();
    }
  };

  const getFilteredTickets = () => {
    let filtered = tickets;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(ticket => 
        ticket.id.toString().includes(searchTerm) ||
        ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === filters.status);
    }

    // Ticket type filter
    if (filters.ticketType !== 'all') {
      filtered = filtered.filter(ticket => ticket.ticketType === filters.ticketType);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(ticket => {
        const ticketDate = new Date(ticket.createdAt);
        switch (filters.dateRange) {
          case 'last_7_days':
            return ticketDate >= sevenDaysAgo;
          case 'last_30_days':
            return ticketDate >= thirtyDaysAgo;
          case 'this_year':
            return ticketDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const filteredTickets = getFilteredTickets();

  // Sorting logic - Open tickets first, then by creation date (earliest to latest)
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    // First priority: Open tickets at the top
    if (a.status === 'OPEN' && b.status !== 'OPEN') {
      return -1;
    }
    if (a.status !== 'OPEN' && b.status === 'OPEN') {
      return 1;
    }
    
    // Second priority: Sort by creation date (earliest to latest)
    const aDate = new Date(a.createdAt);
    const bDate = new Date(b.createdAt);
    return aDate - bDate;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTickets = sortedTickets.slice(startIndex, endIndex);

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
          <h3 className="text-lg font-semibold text-gray-900">All Tickets</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">All Tickets</h3>
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
                <h3 className="text-sm font-medium text-red-800">Error loading tickets</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">All Tickets</h3>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="flex items-center space-x-1">
              <label className="text-xs font-medium text-gray-700">Status:</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent w-20"
              >
                <option value="all">All</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-1">
              <label className="text-xs font-medium text-gray-700">Type:</label>
              <select
                value={filters.ticketType}
                onChange={(e) => handleFilterChange('ticketType', e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent w-24"
              >
                <option value="all">All</option>
                <option value="GENERAL_INQUIRY">General Inquiry</option>
                <option value="TECHNICAL_SUPPORT">Technical Support</option>
                <option value="BOOKING_HELP">Booking Help</option>
                <option value="SUSPENSION_APPEAL">Suspension Appeal</option>
                <option value="PARTNERSHIP">Partnership</option>
                <option value="FEEDBACK">Feedback</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-1">
              <label className="text-xs font-medium text-gray-700">Date:</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent w-20"
              >
                <option value="all">All</option>
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="this_year">This Year</option>
              </select>
            </div>
            
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 pr-3 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent w-60"
              />
            </div>
          </div>
        </div>
      </div>
      <div>
        <table className="w-full table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="w-12 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center space-x-1">
                  <span>ID</span>
                  {getSortIcon('id')}
                </div>
              </th>
              <th className="w-48 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="w-36 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="w-28 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="w-20 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="w-16 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentTickets.map((ticket) => (
              <tr key={ticket.id} className={`hover:bg-gray-50 ${ticket.status === 'OPEN' ? 'bg-red-50 border-l-4 border-red-500' : ''}`}>
                <td className="px-2 py-4 text-sm text-gray-900">
                  {ticket.id}
                </td>
                <td className="px-2 py-4">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-gray-700">
                        {ticket.userName ? ticket.userName.charAt(0).toUpperCase() : '?'}
                      </span>
                    </div>
                    <div className="ml-2 min-w-0 flex-1">
                      <div className="text-xs font-medium text-gray-900 truncate" title={ticket.userName || 'Unknown'}>
                        {ticket.userName || 'Unknown User'}
                      </div>
                      <div className="text-xs text-gray-500 truncate" title={ticket.userEmail}>{ticket.userEmail}</div>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-4">
                  <span className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded-full ${getTicketTypeColor(ticket.ticketType)}`}>
                    {formatTicketType(ticket.ticketType)}
                  </span>
                </td>
                <td className="px-2 py-4">
                  <span className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-2 py-4 text-xs text-gray-900">
                  {ticket.createdAt ? (
                    <>
                      <div>{formatDate(ticket.createdAt).datePart}</div>
                      <div className="text-gray-500 text-[0.65rem] leading-tight">{formatDate(ticket.createdAt).timePart}</div>
                    </>
                  ) : 'N/A'}
                </td>
                <td className="px-2 py-4 text-sm font-medium">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleViewTicket(ticket)}
                      className="text-green-600 hover:text-green-900 transition-colors"
                      title="View Ticket Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sortedTickets.length === 0 && searchTerm && (
        <div className="px-6 py-4 text-center text-gray-500">
          No tickets found matching "{searchTerm}"
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, sortedTickets.length)} of {sortedTickets.length} tickets
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

      {/* Ticket View Modal */}
      <TicketViewModal
        ticket={selectedTicket}
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        onTicketAction={handleTicketAction}
      />
    </div>
  );
});

export default TicketsTable;
