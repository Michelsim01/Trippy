import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import adminService from '../services/adminService';
import KYCViewModal from './KYCViewModal';

const KYCTable = ({ onKYCAction }) => {
  const [kycSubmissions, setKycSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });

  const fetchKYCSubmissions = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllKYCSubmissions();
      if (response.success) {
        setKycSubmissions(response.data);
      }
    } catch (error) {
      console.error('Error fetching KYC submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKYCSubmissions();
  }, []);

  const getFilteredSubmissions = () => {
    let filtered = [...kycSubmissions];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(submission => {
        const searchTerm = filters.search.toLowerCase();
        return (
          (submission.userName || '').toLowerCase().includes(searchTerm) ||
          (submission.userEmail || '').toLowerCase().includes(searchTerm) ||
          (submission.docType || '').toLowerCase().includes(searchTerm) ||
          (submission.kycId || submission.id).toString().includes(searchTerm)
        );
      });
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(submission => submission.status === filters.status);
    }

    return filtered;
  };

  const filteredSubmissions = getFilteredSubmissions();

  // Sorting
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    // Always prioritize PENDING submissions at the top
    if (a.status === 'PENDING' && b.status !== 'PENDING') {
      return -1; // a comes first
    }
    if (b.status === 'PENDING' && a.status !== 'PENDING') {
      return 1; // b comes first
    }
    
    // If both are PENDING, sort by submitted date (earliest first)
    if (a.status === 'PENDING' && b.status === 'PENDING') {
      const dateA = new Date(a.submittedAt);
      const dateB = new Date(b.submittedAt);
      return dateA - dateB; // earliest first
    }
    
    // For non-pending submissions, sort by ID in descending order (newest first)
    return b.id - a.id;
  });

  // Pagination
  const totalPages = Math.ceil(sortedSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubmissions = sortedSubmissions.slice(startIndex, startIndex + itemsPerPage);


  const handleViewKYC = (submission) => {
    setSelectedKYC(submission);
    setShowViewModal(true);
  };

  const handleCloseModal = () => {
    setShowViewModal(false);
    setSelectedKYC(null);
  };

  const handleKYCAction = async (submissionId, action, declineMessage = '') => {
    try {
      let response;
      if (action === 'approve') {
        response = await adminService.approveKYC(submissionId);
      } else if (action === 'decline') {
        response = await adminService.declineKYC(submissionId, declineMessage);
      }

      if (response.success) {
        // Refresh the data
        await fetchKYCSubmissions();
        onKYCAction();
        handleCloseModal();
      }
    } catch (error) {
      console.error(`Error ${action}ing KYC:`, error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      NOT_STARTED: { color: 'bg-gray-100 text-gray-800', label: 'Not Started' },
      PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      APPROVED: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      REJECTED: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return (
      <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-700">
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedSubmissions.length)} of {sortedSubmissions.length} results
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {pages.map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && setCurrentPage(page)}
              disabled={page === '...'}
              className={`px-3 py-2 text-sm rounded-md ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : page === '...'
                  ? 'text-gray-400 cursor-default'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">KYC Management</h2>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="NOT_STARTED">Not Started</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-2 ml-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  KYC ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSubmissions.map((submission) => {
                const isPending = submission.status === 'PENDING';
                return (
                  <tr 
                    key={submission.id} 
                    className={`hover:bg-gray-50 ${isPending ? 'bg-red-50 border-l-4 border-red-400' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {submission.kycId || submission.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {submission.docType || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(submission.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(submission.submittedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {(submission.userName || 'U').charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{submission.userName || 'Unknown User'}</div>
                          <div className="text-sm text-gray-500">{submission.userEmail || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewKYC(submission)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {renderPagination()}
      </div>

      {/* KYC View Modal */}
      {showViewModal && selectedKYC && (
        <KYCViewModal
          submission={selectedKYC}
          onClose={handleCloseModal}
          onApprove={(id) => handleKYCAction(id, 'approve')}
          onDecline={(id, message) => handleKYCAction(id, 'decline', message)}
        />
      )}
    </>
  );
};

export default KYCTable;
