import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  Calendar, 
  FileText, 
  ShieldCheck,
  AlertTriangle, 
  Settings,
  LogOut,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navigationItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Experience Management', href: '/admin/experiences', icon: MapPin },
    { name: 'Booking Management', href: '/admin/bookings', icon: Calendar },
    { name: 'Transaction Management', href: '/admin/transactions', icon: FileText },
    { name: 'KYC Management', href: '/admin/kyc', icon: ShieldCheck },
    { name: 'Ticket Resolution', href: '/admin/tickets', icon: AlertTriangle },
    { name: 'User Report Resolution', href: '/admin/reports', icon: AlertTriangle },
    { name: 'Experience Report Resolution', href: '/admin/experience-reports', icon: AlertTriangle },
    { name: 'Admin Referrals', href: '/admin/referrals', icon: UserPlus },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const isActive = (href) => {
    return location.pathname === href;
  };

  return (
    <div className="w-full h-full bg-slate-900 text-white flex flex-col">
      {/* Logo and Title */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/Logo.png" alt="Trippy Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Trippy</h1>
            <p className="text-xs text-slate-400">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info and Logout */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-white">
              {user?.firstName?.charAt(0) || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.firstName || 'Admin'}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {user?.email || 'admin@trippy.com'}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            navigate('/admin/login');
          }}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
