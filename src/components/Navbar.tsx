import React, { useState } from 'react';
import { BookOpen, Bell, Search, LogOut, ShieldAlert, Sparkles, UserCheck, Sun, Moon, Check, X, Info } from 'lucide-react';
import { User, Notification } from '../types';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onNavigateTo: (view: 'dashboard' | 'profile' | 'admin') => void;
  activeView: 'dashboard' | 'profile' | 'admin';
  notifications: Notification[];
  onMarkNotificationRead: (id: string) => void;
  onClearNotifications: () => void;
  onGlobalSearch: (term: string) => void;
  isLightTheme: boolean;
  onToggleTheme: () => void;
}

export default function Navbar({
  currentUser,
  onLogout,
  onNavigateTo,
  activeView,
  notifications,
  onMarkNotificationRead,
  onClearNotifications,
  onGlobalSearch,
  isLightTheme,
  onToggleTheme
}: NavbarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onGlobalSearch(val);
  };

  const handleNotificationClick = (n: Notification) => {
    onMarkNotificationRead(n.id);
    if (n.type === 'certificate') {
      onNavigateTo('profile');
    }
  };

  return (
    <nav className={`sticky top-0 z-40 transition-colors duration-200 border-b ${
      isLightTheme 
        ? 'bg-white border-slate-200 text-slate-800' 
        : 'bg-slate-900/90 border-slate-800 text-white'
    } backdrop-blur-md`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigateTo('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-base tracking-tight block">InternRail</span>
              <span className="text-[10px] text-blue-500 font-bold block leading-none tracking-widest font-mono">TRAINING PLATFORM</span>
            </div>
          </div>

          {/* Global Search Input */}
          <div className="flex-1 max-w-sm mx-4 sm:mx-8">
            <div className="relative">
              <Search className={`absolute left-3.5 top-3 w-4 h-4 ${isLightTheme ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search training modules, videos..."
                className={`w-full text-xs sm:text-sm rounded-full pl-10 pr-4 py-2 outline-none transition-all ${
                  isLightTheme 
                    ? 'bg-slate-100 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500' 
                    : 'bg-slate-950 text-white border border-slate-800 focus:bg-slate-900 focus:ring-2 focus:ring-blue-500'
                }`}
              />
              {searchTerm && (
                <button 
                  onClick={() => { setSearchTerm(''); onGlobalSearch(''); }}
                  className="absolute right-4 top-3 text-slate-400 hover:text-slate-200 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Quick Switch role (For demo user convenience) */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => onNavigateTo(activeView === 'admin' ? 'dashboard' : 'admin')}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                  activeView === 'admin' 
                    ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300' 
                    : 'bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{activeView === 'admin' ? 'View as Intern' : 'View Admin Panel'}</span>
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                isLightTheme 
                  ? 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600' 
                  : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
              }`}
              title={isLightTheme ? 'Toggle Dark Mode' : 'Toggle Light Mode'}
            >
              {isLightTheme ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileDropdown(false);
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all relative ${
                  isLightTheme 
                    ? 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-500' 
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>


              {showNotifications && (
                <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-2xl border py-2 text-xs transition z-50 ${
                  isLightTheme ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
                }`}>
                  <div className="flex justify-between items-center px-4 py-2 border-b border-white/5 pb-2 font-bold text-sm">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={onClearNotifications}
                        className="text-[10px] text-blue-500 hover:underline hover:text-blue-400"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/10">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 italic">
                        No recent updates or alerts.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 hover:bg-blue-600/5 transition cursor-pointer flex gap-2.5 ${
                            !n.isRead ? 'bg-blue-600/5 font-semibold' : ''
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            n.type === 'welcome' ? 'bg-green-400' :
                            n.type === 'completion' ? 'bg-indigo-400' :
                            n.type === 'certificate' ? 'bg-amber-400' : 'bg-blue-400'
                          }`} />
                          <div>
                            <p className="text-xs leading-snug">{n.message}</p>
                            <span className="text-[10px] text-slate-500 block mt-1">{n.date}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowNotifications(false);
                }}
                className={`flex items-center gap-3 pl-4 border-l transition hover:opacity-90 outline-none select-none cursor-pointer ${
                  isLightTheme 
                    ? 'border-slate-200 text-slate-800' 
                    : 'border-slate-800 text-white'
                }`}
              >
                <div className="hidden sm:block text-right text-[11px] sm:text-xs">
                  <p className={`font-semibold leading-tight ${isLightTheme ? 'text-slate-900' : 'text-slate-100'}`}>
                    {currentUser?.fullName || 'Guest Intern'}
                  </p>
                  <p className="text-[10px] text-slate-550 text-slate-500 leading-none mt-1 font-mono uppercase tracking-tight">
                    Ref: {currentUser?.studentId || 'UNKNOWN'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-slate-900 rounded-full border-2 border-blue-500 flex items-center justify-center font-bold text-blue-700 dark:text-blue-400 shrink-0 shadow-sm uppercase">
                  {currentUser?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'RK'}
                </div>
              </button>

              {showProfileDropdown && (
                <div className={`absolute right-0 mt-2 w-52 rounded-xl shadow-2xl border py-1.5 z-50 text-xs ${
                  isLightTheme ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
                }`}>
                  <div className="px-4 py-2 border-b border-slate-700/10 mb-1">
                    <p className="font-bold text-slate-400 uppercase tracking-widest text-[9px] font-mono">Logged in as</p>
                    <p className="font-bold mt-0.5 max-w-full overflow-hidden text-ellipsis">{currentUser?.email}</p>
                  </div>

                  <button
                    onClick={() => { onNavigateTo('dashboard'); setShowProfileDropdown(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-blue-600/10 hover:text-blue-400 transition"
                  >
                    Training Dashboard
                  </button>

                  <button
                    onClick={() => { onNavigateTo('profile'); setShowProfileDropdown(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-blue-600/10 hover:text-blue-400 transition"
                  >
                    My Profile & Certs
                  </button>

                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => { onNavigateTo('admin'); setShowProfileDropdown(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-purple-600/10 text-purple-400 transition font-bold"
                    >
                      Admin Dashboard
                    </button>
                  )}

                  <hr className="border-slate-800/10 my-1" />

                  <button
                    onClick={() => { onLogout(); setShowProfileDropdown(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-red-600/10 text-red-500 transition flex items-center justify-between font-semibold"
                  >
                    <span>Sign Out</span>
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
}
