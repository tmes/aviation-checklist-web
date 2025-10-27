import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getChecklist } from '../../lib/api/checklist';
import { startExecution } from '../../lib/api/execution';
import type { Checklist } from '../../types';
import { ArrowLeft, Play, Plane } from 'lucide-react';

export default function PilotChecklistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && token) {
      loadChecklist(id);
    }
  }, [id, token]);

  const loadChecklist = async (checklistId: string) => {
    if (!token || !checklistId) return;

    try {
      setLoading(true);
      const data = await getChecklist(token, checklistId);
      setChecklist(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load checklist');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExecution = async () => {
    if (!token || !id) return;

    try {
      setStarting(true);
      const execution = await startExecution(token, { checklistId: id });
      navigate(`/executions/${execution.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to start execution');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">Loading...</div>
      </div>
    );
  }

  if (error || !checklist) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl p-6">
            <p className="text-xl text-red-800 dark:text-red-400">
              {error || 'Checklist not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-20">
            <button
              onClick={() => navigate('/pilot')}
              className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-7 w-7 text-gray-900 dark:text-gray-100" />
            </button>
            <div className="flex items-center gap-3">
              <Plane className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pilot Mode</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Checklist Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {checklist.name}
            </h2>
            {checklist.description && (
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {checklist.description}
              </p>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {checklist.aircraftRegistration && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">Aircraft</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                  {checklist.aircraftRegistration}
                </p>
                {checklist.aircraftType && (
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    {checklist.aircraftType}
                  </p>
                )}
              </div>
            )}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-400 mb-1">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {checklist.items?.length || 0}
              </p>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartExecution}
            disabled={starting}
            className="w-full flex items-center justify-center gap-4 px-8 py-6 bg-green-600 dark:bg-green-500 text-white rounded-2xl hover:bg-green-700 dark:hover:bg-green-600 font-bold text-2xl shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Play className="h-10 w-10" fill="currentColor" />
            <span>{starting ? 'Starting...' : 'Start Checklist'}</span>
          </button>
        </div>

        {/* Preview Note */}
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg">Ready to begin? Tap the button above to start your checklist.</p>
        </div>
      </div>
    </div>
  );
}
