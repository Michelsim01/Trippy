import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, MessageSquare, CheckCircle } from 'lucide-react';
import { adminService } from '../services/adminService';
import ReportsTable from '../components/ReportsTable';

const ReportResolutionPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const reportsTableRef = useRef(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await adminService.getReportMetrics();
      
      if (response.success) {
        setMetrics(response.data);
        setError(null);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to load report management metrics');
      console.error('Report management error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleReportAction = () => {
    // Refresh metrics when report actions occur
    fetchMetrics();
    
    // Also refresh table to ensure immediate updates
    if (reportsTableRef.current && reportsTableRef.current.refreshReports) {
      reportsTableRef.current.refreshReports();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Report Resolution</h1>
        <p className="text-gray-600">Manage user reports and complaints</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {loading ? (
          // Loading state
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="ml-4">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : error ? (
          // Error state
          <div className="col-span-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading report metrics</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Real data
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Reports</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics?.totalReports?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Open Reports</p>
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics?.openReports?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Dismissed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics?.dismissedReports?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics?.resolvedReports?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reports Table */}
      <div className="grid grid-cols-1 gap-6">
        <ReportsTable ref={reportsTableRef} onReportAction={handleReportAction} />
      </div>
    </div>
  );
};

export default ReportResolutionPage;

