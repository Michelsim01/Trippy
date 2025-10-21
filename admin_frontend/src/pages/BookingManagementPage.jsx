import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, XCircle, Bell } from 'lucide-react';
import BookingsTable from '../components/BookingsTable';
import { adminService } from '../services/adminService';

const BookingManagementPage = () => {
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    paidBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [metricsError, setMetricsError] = useState(null);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderMessage, setReminderMessage] = useState(null);

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    setMetricsError(null);
    try {
      const response = await adminService.getBookingManagementMetrics();
      if (response.success) {
        setMetrics(response.data);
      } else {
        setMetricsError(response.error);
      }
    } catch (err) {
      setMetricsError('Failed to fetch booking metrics.');
      console.error('Error fetching booking metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-600">Manage bookings, reservations, and customer interactions</p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          
          {/* Reminder message */}
          {reminderMessage && (
            <div className={`px-3 py-2 rounded-md text-sm font-medium ${
              reminderMessage.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {reminderMessage.text}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Bookings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              {loadingMetrics ? (
                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
              ) : metricsError ? (
                <p className="text-red-500 text-lg font-bold">Error</p>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{metrics.totalBookings}</p>
              )}
            </div>
          </div>
        </div>

        {/* Paid Bookings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Paid Bookings</p>
              {loadingMetrics ? (
                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
              ) : metricsError ? (
                <p className="text-red-500 text-lg font-bold">Error</p>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{metrics.paidBookings}</p>
              )}
            </div>
          </div>
        </div>

        {/* Pending Bookings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Bookings</p>
              {loadingMetrics ? (
                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
              ) : metricsError ? (
                <p className="text-red-500 text-lg font-bold">Error</p>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{metrics.pendingBookings}</p>
              )}
            </div>
          </div>
        </div>

        {/* Cancelled Bookings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cancelled Bookings</p>
              {loadingMetrics ? (
                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
              ) : metricsError ? (
                <p className="text-red-500 text-lg font-bold">Error</p>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{metrics.cancelledBookings}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <BookingsTable onBookingAction={fetchMetrics} />
    </div>
  );
};

export default BookingManagementPage;