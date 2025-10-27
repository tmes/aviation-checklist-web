import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { createChecklist, updateChecklist, getChecklist } from '../lib/api/checklist';
import { getAircraft } from '../lib/api/aircraft';
import Navigation from '../components/Navigation';
import type { Aircraft, ChecklistPhase } from '../types';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';

interface ChecklistItemFormData {
  phase: ChecklistPhase;
  itemText: string;
  expectedValue?: string;
  notes?: string; // Permanent notes for this item
  sortOrder?: number;
  isCritical: boolean;
  requiresConfirmation: boolean;
}

const PHASES: { value: ChecklistPhase; label: string }[] = [
  { value: 'pre_flight', label: 'Pre-Flight' },
  { value: 'startup', label: 'Startup' },
  { value: 'taxi', label: 'Taxi' },
  { value: 'before_takeoff', label: 'Before Takeoff' },
  { value: 'takeoff', label: 'Takeoff' },
  { value: 'climb', label: 'Climb' },
  { value: 'cruise', label: 'Cruise' },
  { value: 'descent', label: 'Descent' },
  { value: 'approach', label: 'Approach' },
  { value: 'landing', label: 'Landing' },
  { value: 'after_landing', label: 'After Landing' },
  { value: 'shutdown', label: 'Shutdown' },
  { value: 'post_flight', label: 'Post-Flight' },
  { value: 'emergency', label: 'Emergency' },
];

export default function ChecklistForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [aircraftId, setAircraftId] = useState('');
  const [items, setItems] = useState<ChecklistItemFormData[]>([]);

  useEffect(() => {
    loadAircraft();
    if (id) {
      loadChecklist(id);
    }
  }, [id]);

  const loadAircraft = async () => {
    if (!token) return;
    try {
      const data = await getAircraft(token);
      setAircraft(data);
    } catch (err) {
      console.error('Failed to load aircraft:', err);
    }
  };

  const loadChecklist = async (checklistId: string) => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await getChecklist(token, checklistId);
      setName(data.name);
      setDescription(data.description || '');
      setAircraftId(data.aircraftId || '');

      if (data.items) {
        setItems(
          data.items.map((item) => ({
            phase: item.phase,
            itemText: item.itemText,
            expectedValue: item.expectedValue || '',
            notes: item.notes || '',
            sortOrder: item.sortOrder,
            isCritical: item.isCritical,
            requiresConfirmation: item.requiresConfirmation,
          }))
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load checklist');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        phase: 'pre_flight',
        itemText: '',
        expectedValue: '',
        notes: '',
        isCritical: false,
        requiresConfirmation: true,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ChecklistItemFormData, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return;
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = {
        name,
        description: description || undefined,
        aircraftId: aircraftId || undefined,
        items: items.map((item, index) => ({
          ...item,
          sortOrder: index,
        })),
      };

      if (id) {
        await updateChecklist(token, id, data);
      } else {
        await createChecklist(token, data);
      }

      navigate('/checklists');
    } catch (err: any) {
      setError(err.message || 'Failed to save checklist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/checklists')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Checklists
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {id ? 'Edit Checklist' : 'Create Checklist'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {id ? 'Update your checklist details and items' : 'Create a new aviation checklist'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Basic Information
            </h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Checklist Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="e.g., Cessna 172 Pre-Flight"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="Optional description"
                />
              </div>

              {/* Aircraft */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Aircraft
                </label>
                <select
                  value={aircraftId}
                  onChange={(e) => setAircraftId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                  <option value="">No specific aircraft</option>
                  {aircraft.map((ac) => (
                    <option key={ac.id} value={ac.id}>
                      {ac.registration} - {ac.type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Checklist Items Card */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Checklist Items
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white text-sm rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No items yet. Click "Add Item" to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Item {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Phase */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Phase
                        </label>
                        <select
                          value={item.phase}
                          onChange={(e) => updateItem(index, 'phase', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          {PHASES.map((phase) => (
                            <option key={phase.value} value={phase.value}>
                              {phase.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Item Text */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Item Text *
                        </label>
                        <input
                          type="text"
                          value={item.itemText}
                          onChange={(e) => updateItem(index, 'itemText', e.target.value)}
                          required
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="e.g., Fuel selector"
                        />
                      </div>

                      {/* Expected Value */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Expected Value/Response
                        </label>
                        <input
                          type="text"
                          value={item.expectedValue || ''}
                          onChange={(e) => updateItem(index, 'expectedValue', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="e.g., BOTH"
                        />
                      </div>

                      {/* Notes */}
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Notes (Optional)
                        </label>
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => updateItem(index, 'notes', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="e.g., should be green, 25 PSI"
                        />
                      </div>

                      {/* Checkboxes */}
                      <div className="flex items-center gap-4 md:col-span-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.isCritical}
                            onChange={(e) => updateItem(index, 'isCritical', e.target.checked)}
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Critical</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.requiresConfirmation}
                            onChange={(e) => updateItem(index, 'requiresConfirmation', e.target.checked)}
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Requires Confirmation</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/checklists')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : id ? 'Update Checklist' : 'Create Checklist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
