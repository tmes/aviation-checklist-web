import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  getExecution,
  updateExecutionItem,
  completeExecution,
  abortExecution,
  type ChecklistExecution as ExecutionType,
  type ChecklistExecutionItem,
} from '../lib/api/execution';
import Navigation from '../components/Navigation';
import {
  ArrowLeft,
  Check,
  X,
  SkipForward,
  AlertCircle,
  CheckCircle2,
  Flag,
} from 'lucide-react';

const PHASE_LABELS: Record<string, string> = {
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

export default function ChecklistExecution() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [execution, setExecution] = useState<ExecutionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  useEffect(() => {
    if (id && token) {
      loadExecution(id);
    }
  }, [id, token]);

  const loadExecution = async (executionId: string) => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await getExecution(token, executionId);
      setExecution(data);

      // Find first uncompleted item
      if (data.items) {
        const firstUncompleted = data.items.findIndex((item) => !item.execution_status);
        if (firstUncompleted !== -1) {
          setCurrentItemIndex(firstUncompleted);
        }
      }

      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load execution');
    } finally {
      setLoading(false);
    }
  };

  const handleItemAction = async (action: 'completed' | 'skipped' | 'failed') => {
    if (!token || !id || !execution?.items) return;

    const currentItem = execution.items[currentItemIndex];
    if (!currentItem) return;

    try {
      await updateExecutionItem(token, id, currentItem.id, { action });

      // Reload execution to get updated data
      await loadExecution(id);

      // Move to next item if not at the end
      if (currentItemIndex < execution.items.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update item');
    }
  };

  const handleComplete = async () => {
    if (!token || !id || !confirm('Complete this checklist execution?')) return;

    try {
      await completeExecution(token, id);
      navigate('/checklists');
    } catch (err: any) {
      alert(err.message || 'Failed to complete execution');
    }
  };

  const handleAbort = async () => {
    if (!token || !id || !confirm('Abort this checklist execution?')) return;

    try {
      await abortExecution(token, id);
      navigate('/checklists');
    } catch (err: any) {
      alert(err.message || 'Failed to abort execution');
    }
  };

  const goToItem = (index: number) => {
    if (index >= 0 && index < (execution?.items?.length || 0)) {
      setCurrentItemIndex(index);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-gray-900 dark:text-gray-100">Loading execution...</div>
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-400">{error || 'Execution not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const items = execution.items || [];
  const currentItem = items[currentItemIndex];
  const completedCount = items.filter((item) => item.execution_status === 'completed').length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  // Group items by phase for sidebar
  const groupedItems = items.reduce((acc, item, index) => {
    if (!acc[item.phase]) {
      acc[item.phase] = [];
    }
    acc[item.phase].push({ item, index });
    return acc;
  }, {} as Record<string, Array<{ item: ChecklistExecutionItem; index: number }>>);

  const phases = Object.keys(groupedItems);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar - Item List */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => navigate(`/checklists/${execution.checklist_id}`)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {execution.checklist_name}
            </h2>
            <div className="mt-2">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Progress</span>
                <span>
                  {completedCount}/{items.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-2">
            {phases.map((phase) => {
              const phaseItems = groupedItems[phase];
              return (
                <div key={phase} className="mb-4">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {PHASE_LABELS[phase] || phase}
                  </div>
                  {phaseItems.map(({ item, index }) => (
                    <button
                      key={item.id}
                      onClick={() => goToItem(index)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 ${
                        index === currentItemIndex
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-400'
                          : item.execution_status === 'completed'
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-400'
                          : item.execution_status === 'skipped'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-400'
                          : item.execution_status === 'failed'
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {item.execution_status === 'completed' && (
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        )}
                        {item.execution_status === 'skipped' && (
                          <SkipForward className="h-4 w-4 flex-shrink-0" />
                        )}
                        {item.execution_status === 'failed' && <X className="h-4 w-4 flex-shrink-0" />}
                        <span className="truncate">{item.itemText}</span>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content - Current Item */}
        <div className="flex-1 flex flex-col">
          {currentItem ? (
            <>
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="max-w-2xl w-full">
                  {/* Phase Badge */}
                  <div className="mb-6 flex items-center justify-between">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {PHASE_LABELS[currentItem.phase] || currentItem.phase}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Item {currentItemIndex + 1} of {items.length}
                    </span>
                  </div>

                  {/* Item Text */}
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                    {currentItem.itemText}
                  </h1>

                  {/* Expected Value */}
                  {currentItem.expected_value && (
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-400 font-medium">
                        Expected: {currentItem.expected_value}
                      </p>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="mb-8 flex gap-2">
                    {currentItem.is_critical && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                        <AlertCircle className="h-4 w-4" />
                        Critical
                      </span>
                    )}
                    {currentItem.requires_confirmation && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Requires Confirmation
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {!currentItem.execution_status ? (
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        onClick={() => handleItemAction('completed')}
                        className="flex flex-col items-center gap-2 px-6 py-8 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 font-medium"
                      >
                        <Check className="h-8 w-8" />
                        <span>Complete</span>
                      </button>
                      <button
                        onClick={() => handleItemAction('skipped')}
                        className="flex flex-col items-center gap-2 px-6 py-8 bg-yellow-600 dark:bg-yellow-500 text-white rounded-lg hover:bg-yellow-700 dark:hover:bg-yellow-600 font-medium"
                      >
                        <SkipForward className="h-8 w-8" />
                        <span>Skip</span>
                      </button>
                      <button
                        onClick={() => handleItemAction('failed')}
                        className="flex flex-col items-center gap-2 px-6 py-8 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 font-medium"
                      >
                        <X className="h-8 w-8" />
                        <span>Failed</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                      <p className="text-gray-600 dark:text-gray-400">
                        Item marked as: <span className="font-semibold capitalize">{currentItem.execution_status}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Navigation */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between bg-white dark:bg-gray-800">
                <button
                  onClick={() => goToItem(currentItemIndex - 1)}
                  disabled={currentItemIndex === 0}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50"
                >
                  ← Previous
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleAbort}
                    className="px-4 py-2 border border-red-600 dark:border-red-400 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Abort
                  </button>
                  {currentItemIndex === items.length - 1 && (
                    <button
                      onClick={handleComplete}
                      className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 flex items-center gap-2"
                    >
                      <Flag className="h-4 w-4" />
                      Complete
                    </button>
                  )}
                </div>

                <button
                  onClick={() => goToItem(currentItemIndex + 1)}
                  disabled={currentItemIndex === items.length - 1}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No items in this checklist</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
