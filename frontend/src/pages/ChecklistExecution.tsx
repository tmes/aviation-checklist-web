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
  AlertTriangle,
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

const PHASE_ORDER = [
  'pre_flight', 'startup', 'taxi', 'before_takeoff', 'takeoff',
  'climb', 'cruise', 'descent', 'approach', 'landing',
  'after_landing', 'shutdown', 'post_flight', 'emergency'
];

export default function ChecklistExecution() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [execution, setExecution] = useState<ExecutionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [showItemList, setShowItemList] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [itemNotes, setItemNotes] = useState(''); // General notes for any action
  const [showPhaseWarning, setShowPhaseWarning] = useState(false);
  const [phaseWarningMessage, setPhaseWarningMessage] = useState('');
  const [pendingNextIndex, setPendingNextIndex] = useState<number | null>(null);

  useEffect(() => {
    if (id && token) {
      loadExecution(id);
    }
  }, [id, token]);

  // Clear notes when moving to a different item
  useEffect(() => {
    setItemNotes('');
  }, [currentItemIndex]);

  const loadExecution = async (executionId: string) => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await getExecution(token, executionId);
      setExecution(data);

      // Find first uncompleted item
      if (data.items) {
        const firstUncompleted = data.items.findIndex((item) => !item.executionStatus);
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

  const handleItemAction = async (action: 'completed' | 'skipped') => {
    if (!token || !id || !execution?.items) return;

    const currentItem = execution.items[currentItemIndex];
    if (!currentItem) return;

    try {
      // Use itemNotes if provided
      await updateExecutionItem(token, id, currentItem.id, {
        action,
        notes: itemNotes || undefined
      });
      await loadExecution(id);

      // Clear notes after successful action
      setItemNotes('');

      // Move to next item if not at the end
      if (currentItemIndex < execution.items.length - 1) {
        goToNext();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update item');
    }
  };

  const handleFailedAction = async () => {
    if (!token || !id || !execution?.items) return;

    const currentItem = execution.items[currentItemIndex];
    if (!currentItem) return;

    try {
      await updateExecutionItem(token, id, currentItem.id, {
        action: 'failed',
        notes: itemNotes || undefined,
      });
      await loadExecution(id);
      setShowFailedModal(false);
      setItemNotes('');

      // Move to next item if not at the end
      if (currentItemIndex < execution.items.length - 1) {
        goToNext();
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

  const checkPhaseTransition = (nextIndex: number) => {
    if (!execution?.items) return true;

    const currentItem = execution.items[currentItemIndex];
    const nextItem = execution.items[nextIndex];

    if (!currentItem || !nextItem) return true;

    // Check if we're moving to a different phase
    if (currentItem.phase !== nextItem.phase) {
      // Find all items in current phase
      const currentPhaseItems = execution.items.filter(item => item.phase === currentItem.phase);
      const incompleteItems = currentPhaseItems.filter(item => !item.executionStatus);

      if (incompleteItems.length > 0) {
        const incompleteList = incompleteItems.map(item => `• ${item.itemText}`).join('\n');
        setPhaseWarningMessage(
          `You have ${incompleteItems.length} incomplete item(s) in ${PHASE_LABELS[currentItem.phase]}:\n\n${incompleteList}\n\nAre you sure you want to continue to ${PHASE_LABELS[nextItem.phase]}?`
        );
        setPendingNextIndex(nextIndex);
        setShowPhaseWarning(true);
        return false;
      }
    }

    return true;
  };

  const confirmPhaseTransition = () => {
    if (pendingNextIndex !== null) {
      setCurrentItemIndex(pendingNextIndex);
      setPendingNextIndex(null);
    }
    setShowPhaseWarning(false);
  };

  const cancelPhaseTransition = () => {
    setPendingNextIndex(null);
    setShowPhaseWarning(false);
  };

  const goToNext = () => {
    const nextIndex = currentItemIndex + 1;
    if (nextIndex < (execution?.items?.length || 0)) {
      if (checkPhaseTransition(nextIndex)) {
        setCurrentItemIndex(nextIndex);
      }
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
  const nextItem = currentItemIndex < items.length - 1 ? items[currentItemIndex + 1] : null;
  const completedCount = items.filter((item) => item.executionStatus).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const isLastItem = currentItemIndex === items.length - 1;
  const allItemsCompleted = completedCount === totalCount;

  // Group items by phase
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
                <span className="font-bold text-base">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-green-600 dark:bg-green-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {completedCount} of {totalCount} items
              </p>
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
                        {item.executionStatus === 'completed' && (
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        )}
                        {item.executionStatus === 'skipped' && (
                          <SkipForward className="h-4 w-4 flex-shrink-0" />
                        )}
                        {item.executionStatus === 'failed' && <X className="h-4 w-4 flex-shrink-0" />}
                        <span className="truncate">{item.itemText}</span>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {currentItem ? (
            <>
              {/* Header with progress - Mobile */}
              <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => navigate(`/checklists/${execution.checklist_id}`)}
                    className="p-2 -ml-2 text-gray-600 dark:text-gray-400"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {progress}%
                    </span>
                    <button
                      onClick={() => setShowItemList(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      <List className="h-4 w-4" />
                      {completedCount}/{totalCount}
                    </button>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-green-600 dark:bg-green-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Item Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                  {/* Phase Badge */}
                  <div className="mb-4 flex items-center justify-between">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {PHASE_LABELS[currentItem.phase] || currentItem.phase}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {currentItemIndex + 1} / {totalCount}
                    </span>
                  </div>

                  {/* Item Text */}
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
                    {currentItem.itemText}
                  </h1>

                  {/* Critical and Confirmation Badges - PROMINENT */}
                  {(currentItem.isCritical || currentItem.requiresConfirmation) && (
                    <div className="mb-6 space-y-2">
                      {currentItem.isCritical && (
                        <div className="flex items-center gap-3 p-4 bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500 dark:border-orange-600 rounded-xl">
                          <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                          <span className="text-base font-bold text-orange-900 dark:text-orange-300">
                            CRITICAL ITEM - Extra attention required
                          </span>
                        </div>
                      )}
                      {currentItem.requiresConfirmation && (
                        <div className="flex items-center gap-3 p-4 bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500 dark:border-purple-600 rounded-xl">
                          <CheckCircle2 className="h-6 w-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                          <span className="text-base font-bold text-purple-900 dark:text-purple-300">
                            CONFIRMATION REQUIRED
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expected Value - PROMINENT */}
                  {currentItem.expectedValue && (
                    <div className="mb-6 p-5 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2">
                        Expected Response:
                      </p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                        {currentItem.expectedValue}
                      </p>
                    </div>
                  )}

                  {/* Permanent Notes - Part of checklist item definition */}
                  {currentItem.notes && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Note:
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {currentItem.notes}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!currentItem.executionStatus ? (
                    <div className="space-y-3 mb-6">
                      <button
                        onClick={() => handleItemAction('completed')}
                        className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-transparent border-[3px] border-green-600 dark:border-green-500 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-600 dark:hover:bg-green-500 hover:text-white dark:hover:text-gray-900 font-bold text-lg shadow-lg transition-all active:scale-[0.98]"
                      >
                        <Check className="h-7 w-7" />
                        <span>Complete</span>
                      </button>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleItemAction('skipped')}
                          className="flex items-center justify-center gap-2 px-4 py-4 bg-transparent border-2 border-yellow-600 dark:border-yellow-500 text-yellow-600 dark:text-yellow-400 rounded-xl hover:bg-yellow-600 dark:hover:bg-yellow-500 hover:text-white dark:hover:text-gray-900 font-semibold shadow-md transition-all active:scale-[0.98]"
                        >
                          <SkipForward className="h-5 w-5" />
                          <span>Skip</span>
                        </button>
                        <button
                          onClick={() => setShowFailedModal(true)}
                          className="flex items-center justify-center gap-2 px-4 py-4 bg-transparent border-2 border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-600 dark:hover:bg-red-500 hover:text-white dark:hover:text-gray-900 font-semibold shadow-md transition-all active:scale-[0.98]"
                        >
                          <X className="h-5 w-5" />
                          <span>Failed</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-xl text-center border-2 border-gray-200 dark:border-gray-700 mb-6">
                      <p className="text-lg text-gray-600 dark:text-gray-400">
                        Status:{' '}
                        <span className={`font-bold capitalize ${
                          currentItem.executionStatus === 'completed' ? 'text-green-600 dark:text-green-400' :
                          currentItem.executionStatus === 'skipped' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {currentItem.executionStatus}
                        </span>
                      </p>
                      {currentItem.executionNotes && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                          Note: {currentItem.executionNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Runtime Notes Field - BELOW action buttons */}
                  {!currentItem.executionStatus && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        value={itemNotes}
                        onChange={(e) => setItemNotes(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                        placeholder="Add any additional notes or observations during execution..."
                      />
                    </div>
                  )}

                  {/* Next Item Preview */}
                  {nextItem && !isLastItem && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Next:
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {nextItem.itemText}
                      </p>
                      {nextItem.phase !== currentItem.phase && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-semibold">
                          → {PHASE_LABELS[nextItem.phase]}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Navigation Bar */}
              <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4 shadow-lg">
                <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
                  <button
                    onClick={goToPrevious}
                    disabled={currentItemIndex === 0}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span className="hidden sm:inline">Prev</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={handleAbort}
                      className="px-3 sm:px-4 py-2.5 text-sm font-medium border-2 border-red-600 dark:border-red-400 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Abort
                    </button>
                    {isLastItem && allItemsCompleted && (
                      <button
                        onClick={handleComplete}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm bg-transparent border-2 border-green-600 dark:border-green-500 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-600 dark:hover:bg-green-500 hover:text-white dark:hover:text-gray-900 font-bold shadow-lg transition-all"
                      >
                        <Flag className="h-4 w-4" />
                        <span>Complete</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={goToNext}
                    disabled={isLastItem}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
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

      {/* Failed Modal */}
      {showFailedModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowFailedModal(false)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Item Failed - Add Notes
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Describe what failed or what the issue is (optional):
            </p>
            <textarea
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
              placeholder="e.g., Fuel selector stuck, indicator light not working..."
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowFailedModal(false);
                  // Keep notes - user might want to try a different action
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFailedAction}
                className="flex-1 px-4 py-3 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 font-bold transition-colors"
              >
                Mark as Failed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase Warning Modal */}
      {showPhaseWarning && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Incomplete Phase
              </h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line mb-6">
              {phaseWarningMessage}
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelPhaseTransition}
                className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Stay Here
              </button>
              <button
                onClick={confirmPhaseTransition}
                className="flex-1 px-4 py-3 bg-orange-600 dark:bg-orange-500 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 font-bold transition-colors"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {completedCount} of {totalCount} completed ({progress}%)
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
                            : item.executionStatus === 'completed'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-400'
                            : item.executionStatus === 'skipped'
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-400'
                            : item.executionStatus === 'failed'
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.executionStatus === 'completed' && (
                            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                          )}
                          {item.executionStatus === 'skipped' && (
                            <SkipForward className="h-5 w-5 flex-shrink-0" />
                          )}
                          {item.executionStatus === 'failed' && <X className="h-5 w-5 flex-shrink-0" />}
                          {!item.executionStatus && (
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
