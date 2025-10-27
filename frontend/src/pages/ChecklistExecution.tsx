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
  List,
  ChevronLeft,
  ChevronRight,
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
  const [showItemList, setShowItemList] = useState(false);

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
      setShowItemList(false);
    }
  };

  const goToPrevious = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentItemIndex < (execution?.items?.length || 0) - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
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

  // Group items by phase for sidebar/list
  const groupedItems = items.reduce((acc, item, index) => {
    if (!acc[item.phase]) {
      acc[item.phase] = [];
    }
    acc[item.phase].push({ item, index });
    return acc;
  }, {} as Record<string, Array<{ item: ChecklistExecutionItem; index: number }>>);

  const phases = Object.keys(groupedItems);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navigation />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar - Desktop only */}
        <div className="hidden lg:block lg:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <button
              onClick={() => navigate(`/checklists/${execution.checklist_id}`)}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-3"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 line-clamp-2">
              {execution.checklist_name}
            </h2>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Progress</span>
                <span className="font-medium">
                  {completedCount}/{items.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all duration-300"
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
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {PHASE_LABELS[phase] || phase}
                  </div>
                  {phaseItems.map(({ item, index }) => (
                    <button
                      key={item.id}
                      onClick={() => goToItem(index)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 transition-colors ${
                        index === currentItemIndex
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-400 font-medium'
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
              {/* Header with progress - Mobile */}
              <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => navigate(`/checklists/${execution.checklist_id}`)}
                    className="p-2 -ml-2 text-gray-600 dark:text-gray-400"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setShowItemList(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    <List className="h-4 w-4" />
                    {completedCount}/{items.length}
                  </button>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Item Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                  {/* Phase Badge */}
                  <div className="mb-4 flex items-center justify-between">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {PHASE_LABELS[currentItem.phase] || currentItem.phase}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {currentItemIndex + 1} / {items.length}
                    </span>
                  </div>

                  {/* Item Text */}
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                    {currentItem.itemText}
                  </h1>

                  {/* Expected Value */}
                  {currentItem.expected_value && (
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                        Expected: <span className="font-bold">{currentItem.expected_value}</span>
                      </p>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="mb-6 flex flex-wrap gap-2">
                    {currentItem.is_critical && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                        <AlertCircle className="h-4 w-4" />
                        Critical
                      </span>
                    )}
                    {currentItem.requires_confirmation && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Confirm
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {!currentItem.execution_status ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => handleItemAction('completed')}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 sm:py-5 bg-green-600 dark:bg-green-500 text-white rounded-xl hover:bg-green-700 dark:hover:bg-green-600 font-semibold text-lg shadow-lg transition-all active:scale-95"
                      >
                        <Check className="h-6 w-6" />
                        <span>Complete</span>
                      </button>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleItemAction('skipped')}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 dark:bg-yellow-500 text-white rounded-xl hover:bg-yellow-700 dark:hover:bg-yellow-600 font-medium shadow-md transition-all active:scale-95"
                        >
                          <SkipForward className="h-5 w-5" />
                          <span>Skip</span>
                        </button>
                        <button
                          onClick={() => handleItemAction('failed')}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 dark:bg-red-500 text-white rounded-xl hover:bg-red-700 dark:hover:bg-red-600 font-medium shadow-md transition-all active:scale-95"
                        >
                          <X className="h-5 w-5" />
                          <span>Failed</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-xl text-center border-2 border-gray-200 dark:border-gray-700">
                      <p className="text-lg text-gray-600 dark:text-gray-400">
                        Marked as:{' '}
                        <span className="font-semibold capitalize text-gray-900 dark:text-gray-100">
                          {currentItem.execution_status}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Navigation Bar */}
              <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4">
                <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
                  <button
                    onClick={goToPrevious}
                    disabled={currentItemIndex === 0}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={handleAbort}
                      className="px-3 sm:px-4 py-2 text-sm border border-red-600 dark:border-red-400 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Abort
                    </button>
                    {currentItemIndex === items.length - 1 && completedCount === items.length && (
                      <button
                        onClick={handleComplete}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 font-medium transition-colors"
                      >
                        <Flag className="h-4 w-4" />
                        <span className="hidden sm:inline">Complete</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={goToNext}
                    disabled={currentItemIndex === items.length - 1}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No items in this checklist</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Item List Modal */}
      {showItemList && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setShowItemList(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">All Items</h3>
                <button
                  onClick={() => setShowItemList(false)}
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {completedCount} of {items.length} completed
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(80vh-100px)] p-2">
              {phases.map((phase) => {
                const phaseItems = groupedItems[phase];
                return (
                  <div key={phase} className="mb-4">
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {PHASE_LABELS[phase] || phase}
                    </div>
                    {phaseItems.map(({ item, index }) => (
                      <button
                        key={item.id}
                        onClick={() => goToItem(index)}
                        className={`w-full text-left px-3 py-3 rounded-lg text-sm mb-1 transition-colors ${
                          index === currentItemIndex
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-400 font-medium'
                            : item.execution_status === 'completed'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-400'
                            : item.execution_status === 'skipped'
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-400'
                            : item.execution_status === 'failed'
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.execution_status === 'completed' && (
                            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                          )}
                          {item.execution_status === 'skipped' && (
                            <SkipForward className="h-5 w-5 flex-shrink-0" />
                          )}
                          {item.execution_status === 'failed' && <X className="h-5 w-5 flex-shrink-0" />}
                          {!item.execution_status && (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                          )}
                          <span className="flex-1">{item.itemText}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
