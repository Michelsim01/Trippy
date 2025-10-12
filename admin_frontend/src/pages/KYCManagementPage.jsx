import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, CheckCircle, XCircle } from 'lucide-react';
import KYCTable from '../components/KYCTable';
import adminService from '../services/adminService';

const KYCManagementPage = () => {
  const [metrics, setMetrics] = useState({
    totalSubmissions: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    declinedSubmissions: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await adminService.getKYCMetrics();
      if (response.success) {
        setMetrics(response.data);
      }
    } catch (error) {
      console.error('Error fetching KYC metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleKYCAction = () => {
    // Refresh metrics after any KYC action
    fetchMetrics();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">KYC Management</h1>
        <p className="text-gray-600 mt-2">Review and manage tour guide verification submissions</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Submissions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Submissions</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  metrics.totalSubmissions
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Submissions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Pending Review</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  metrics.pendingSubmissions
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Approved Submissions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Approved</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  metrics.approvedSubmissions
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Declined Submissions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Declined</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  metrics.declinedSubmissions
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Table */}
      <KYCTable onKYCAction={handleKYCAction} />
    </div>
  );
};

export default KYCManagementPage;
