import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { getChecklist, deleteChecklist } from '../lib/api/checklist';
import { startExecution } from '../lib/api/execution';
import Navigation from '../components/Navigation';
import type { Checklist, ChecklistItem, ChecklistPhase } from '../types';
import { ArrowLeft, Edit, Trash2, Play, AlertCircle, CheckCircle } from 'lucide-react';

const PHASE_LABELS: Record<ChecklistPhase, string> = {
  pre_flight: 'Pre-Flight',
  startup: 'Startup',
  taxi: 'Taxi',
  before_takeoff: 'Before Takeoff',
  takeoff: 'Takeoff',
  climb: 'Climb',
  cruise: 'Cruise',
  descent: 'Descent',
  approach: 'Approach',
  landing: 'Landing',
  after_landing: 'After Landing',
  shutdown: 'Shutdown',
  post_flight: 'Post-Flight',
  emergency: 'Emergency',
};

export default function ChecklistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

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

  const handleDelete = async () => {
    if (!token || !id || !confirm('Are you sure you want to delete this checklist?')) return;

    try {
      await deleteChecklist(token, id);
      navigate('/checklists');
    } catch (err: any) {
      alert(err.message || 'Failed to delete checklist');
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

  const groupItemsByPhase = (items: ChecklistItem[] | undefined) => {
    if (!items) return {};

    return items.reduce((acc, item) => {
      if (!acc[item.phase]) {
        acc[item.phase] = [];
      }
      acc[item.phase].push(item);
      return acc;
    }, {} as Record<ChecklistPhase, ChecklistItem[]>);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-gray-900 dark:text-gray-100">Loading...</div>
      </div>
    );
  }

  if (error || !checklist) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-400">
              {error || 'Checklist not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const groupedItems = groupItemsByPhase(checklist.items);
  const phases = Object.keys(groupedItems) as ChecklistPhase[];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/checklists')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Checklists
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {checklist.name}
              </h1>
              {checklist.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {checklist.description}
                </p>
              )}

              {/* Metadata */}
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                {checklist.aircraftRegistration && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Aircraft:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {checklist.aircraftRegistration}
                      {checklist.aircraftType && ` - ${checklist.aircraftType}`}
                    </span>
                  </div>
                )}
                {checklist.organizationName && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">Organization:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {checklist.organizationName}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      checklist.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {checklist.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Items:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {checklist.items?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => navigate(`/checklists/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Start Checklist Button */}
        <div className="mb-6">
          <button
            onClick={handleStartExecution}
            disabled={starting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-transparent border-[3px] border-green-600 dark:border-green-500 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-600 dark:hover:bg-green-500 hover:text-white dark:hover:text-gray-900 font-bold disabled:opacity-50 transition-all"
          >
            <Play className="h-5 w-5" />
            {starting ? 'Starting...' : 'Start Checklist'}
          </button>
        </div>

        {/* Checklist Items by Phase */}
        {phases.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              This checklist has no items yet. Click "Edit" to add items.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {phases.map((phase) => {
              const items = groupedItems[phase];
              const criticalCount = items.filter((item) => item.isCritical).length;

              return (
                <div
                  key={phase}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
                >
                  {/* Phase Header */}
                  <div className="bg-blue-50 dark:bg-blue-900/30 px-6 py-4 border-b border-blue-100 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-400">
                        {PHASE_LABELS[phase]}
                      </h2>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {items.length} {items.length === 1 ? 'item' : 'items'}
                        </span>
                        {criticalCount > 0 && (
                          <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                            <AlertCircle className="h-4 w-4" />
                            {criticalCount} critical
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Phase Items */}
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <div className="flex items-start gap-4">
                          {/* Item Number */}
                          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                            {index + 1}
                          </div>

                          {/* Item Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-gray-900 dark:text-gray-100 font-medium">
                                  {item.itemText}
                                </p>
                                {item.expectedValue && (
                                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    Expected: <span className="font-medium">{item.expectedValue}</span>
                                  </p>
                                )}
                                {item.notes && (
                                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">
                                    Note: {item.notes}
                                  </p>
                                )}
                              </div>

                              {/* Badges */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {item.isCritical && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                    <AlertCircle className="h-3 w-3" />
                                    Critical
                                  </span>
                                )}
                                {item.requiresConfirmation && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                    <CheckCircle className="h-3 w-3" />
                                    Confirm
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
