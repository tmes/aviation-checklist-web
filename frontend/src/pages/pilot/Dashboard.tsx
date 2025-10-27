import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getChecklists } from '../../lib/api/checklist';
import { useDarkMode } from '../../hooks/useDarkMode';
import type { Checklist } from '../../types';
import { Plane, Settings, LogOut, Menu, X, Moon, Sun } from 'lucide-react';

export default function PilotDashboard() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    loadChecklists();
  }, [token]);

  const loadChecklists = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await getChecklists(token);
      // Only show active checklists
      setChecklists(data.filter(cl => cl.isActive));
    } catch (err) {
      console.error('Failed to load checklists:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-lg" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <Plane className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pilot Mode</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user?.firstName} {user?.lastName}</p>
              </div>
            </div>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {showMenu ? (
                <X className="h-8 w-8 text-gray-900 dark:text-gray-100" />
              ) : (
                <Menu className="h-8 w-8 text-gray-900 dark:text-gray-100" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Overlay */}
      {showMenu && (
        <>
          {/* Backdrop - Click to close */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu Content */}
          <div className="sticky top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-2xl z-40 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-3">
              <button
                onClick={() => {
                  navigate('/ground');
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-4 p-5 bg-gray-100 dark:bg-gray-700 rounded-xl text-left hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Settings className="h-7 w-7 text-gray-700 dark:text-gray-300" />
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Ground Operations</span>
              </button>
              <button
                onClick={() => {
                  toggleDarkMode();
                }}
                className="w-full flex items-center gap-4 p-5 bg-gray-100 dark:bg-gray-700 rounded-xl text-left hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="h-7 w-7 text-yellow-500" />
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Dark Mode</span>
                  </>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 p-5 bg-red-50 dark:bg-red-900/30 rounded-xl text-left hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
              >
                <LogOut className="h-7 w-7 text-red-600 dark:text-red-400" />
                <span className="text-lg font-semibold text-red-700 dark:text-red-400">Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Ready for Flight
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Select a checklist to begin
            </p>
          </div>

          {checklists.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 mb-4">
                <Plane className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Active Checklists
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Go to Ground Operations to create checklists
              </p>
              <button
                onClick={() => navigate('/ground/checklists')}
                className="px-8 py-4 bg-blue-600 dark:bg-blue-500 text-white text-lg font-bold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-lg"
              >
                Go to Ground Operations
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {checklists.map((checklist) => (
                <button
                  key={checklist.id}
                  onClick={() => navigate(`/pilot/checklists/${checklist.id}`)}
                  className="w-full p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-400 text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {checklist.name}
                    </h3>
                    {checklist.aircraftRegistration && (
                      <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-bold rounded-lg">
                        {checklist.aircraftRegistration}
                      </span>
                    )}
                  </div>
                  {checklist.description && (
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                      {checklist.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">{checklist.itemCount || 0} items</span>
                    {checklist.aircraftType && (
                      <span>{checklist.aircraftType}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
