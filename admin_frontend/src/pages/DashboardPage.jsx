import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  Calendar, 
  MapPin,
  TrendingUp,
  Activity,
  Star,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { adminService } from '../services/adminService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [categoriesData, setCategoriesData] = useState(null);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [topExperiences, setTopExperiences] = useState([]);
  const [pendingExperiences, setPendingExperiences] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setChartsLoading(true);
        
        // Fetch dashboard metrics
        const metricsResponse = await adminService.getDashboardMetrics();
        if (metricsResponse.success) {
          setMetrics(metricsResponse.data);
          setError(null);
        } else {
          setError(metricsResponse.error);
        }

        // Fetch chart data and dashboard data
        const [revenueResponse, categoriesResponse, topExperiencesResponse, pendingExperiencesResponse] = await Promise.all([
          adminService.getRevenueChartData(),
          adminService.getCategoriesChartData(),
          adminService.getTopPerformingExperiences(),
          adminService.getPendingExperiences()
        ]);

        if (revenueResponse.success) {
          setRevenueData(revenueResponse.data);
        }

        if (categoriesResponse.success) {
          setCategoriesData(categoriesResponse.data);
        }

        if (topExperiencesResponse.success) {
          setTopExperiences(topExperiencesResponse.data);
        }

        if (pendingExperiencesResponse.success) {
          setPendingExperiences(pendingExperiencesResponse.data);
        }

      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
        setChartsLoading(false);
        setDashboardLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatChange = (changePercent) => {
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(1)}%`;
  };

  const getChangeType = (changePercent) => {
    return changePercent >= 0 ? 'positive' : 'negative';
  };

  // Chart configurations
  const getRevenueChartConfig = () => {
    if (!revenueData?.data) return null;

    const labels = revenueData.data.map(item => item.label);
    const data = revenueData.data.map(item => item.revenue);

    return {
      labels,
      datasets: [
        {
          label: 'Revenue ($)',
          data,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(34, 197, 94)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
        },
      ],
    };
  };

  const getCategoriesChartConfig = () => {
    if (!categoriesData?.data) return null;

    const labels = categoriesData.data.map(item => item.category);
    const data = categoriesData.data.map(item => item.count);
    
    // Generate colors for each category
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
      '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
    ];

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: colors.slice(0, labels.length).map(color => color + '80'),
          borderWidth: 2,
          hoverOffset: 10,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          },
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to your Trippy Admin Portal!</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to your Trippy Admin Portal!</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Monthly Revenue',
      value: formatCurrency(metrics?.monthlyRevenue?.current || 0),
      change: formatChange(metrics?.monthlyRevenue?.changePercent || 0),
      changeType: getChangeType(metrics?.monthlyRevenue?.changePercent || 0),
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Total Users',
      value: formatNumber(metrics?.totalUsers?.current || 0),
      change: formatChange(metrics?.totalUsers?.changePercent || 0),
      changeType: getChangeType(metrics?.totalUsers?.changePercent || 0),
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Bookings',
      value: formatNumber(metrics?.totalBookings?.current || 0),
      change: formatChange(metrics?.totalBookings?.changePercent || 0),
      changeType: getChangeType(metrics?.totalBookings?.changePercent || 0),
      icon: Calendar,
      color: 'bg-purple-500'
    },
    {
      title: 'Active Experiences',
      value: formatNumber(metrics?.activeExperiences?.current || 0),
      change: formatChange(metrics?.activeExperiences?.changePercent || 0),
      changeType: getChangeType(metrics?.activeExperiences?.changePercent || 0),
      icon: MapPin,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your Trippy Admin Portal!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className={`text-sm mt-1 ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change} from {metrics?.monthlyRevenue?.period || 'last month'}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <div className="flex items-center space-x-2">
              <TrendingUp className={`w-4 h-4 ${metrics?.monthlyRevenue?.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-sm ${metrics?.monthlyRevenue?.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatChange(metrics?.monthlyRevenue?.changePercent || 0)}
              </span>
            </div>
          </div>
          <div className="h-64">
            {chartsLoading ? (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="animate-pulse text-center">
                  <div className="text-gray-500 mb-2">📈</div>
                  <p className="text-gray-600">Loading chart...</p>
                </div>
              </div>
            ) : getRevenueChartConfig() ? (
              <Line data={getRevenueChartConfig()} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-gray-500 mb-2">📈</div>
                  <p className="text-gray-600">No revenue data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tour Categories Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Experience Categories</h3>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="h-64">
            {chartsLoading ? (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="animate-pulse text-center">
                  <div className="text-gray-500 mb-2">🥧</div>
                  <p className="text-gray-600">Loading chart...</p>
                </div>
              </div>
            ) : getCategoriesChartConfig() ? (
              <Pie data={getCategoriesChartConfig()} options={doughnutOptions} />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-gray-500 mb-2">🥧</div>
                  <p className="text-gray-600">No category data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Experiences */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Experiences</h3>
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
          {dashboardLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : topExperiences.length > 0 ? (
            <div className="space-y-3">
              {topExperiences.map((experience, index) => (
                <div key={experience.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{experience.title}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">{experience.category}</span>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{experience.bookingCount} bookings</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">${experience.totalRevenue}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-xs font-medium text-gray-700">
                      {experience.averageRating ? experience.averageRating.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No experiences data available</p>
            </div>
          )}
        </div>

        {/* Pending Experiences */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
            <AlertCircle className="w-5 h-5 text-orange-500" />
          </div>
          {dashboardLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : pendingExperiences.length > 0 ? (
            <div className="space-y-3">
              {pendingExperiences.map((experience, index) => (
                <div key={experience.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{experience.title}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">{experience.category}</span>
                      <span className="text-xs text-gray-500">{experience.location}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">by {experience.guideName}</span>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {new Date(experience.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-green-600 hover:text-green-700" title="Approve">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-red-600 hover:text-red-700" title="Reject">
                      <AlertCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-gray-500">No pending approvals</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
