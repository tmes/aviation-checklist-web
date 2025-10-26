import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import {
  getAircraftById,
  createAircraft,
  updateAircraft,
} from '../lib/api/aircraft';
import Navigation from '../components/Navigation';
import type { Aircraft, AircraftCategory, CreateAircraftData } from '../types';

export default function AircraftForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuthStore();

  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateAircraftData>({
    // organizationId left undefined = creates personal aircraft
    registration: '',
    type: '',
    manufacturer: '',
    model: '',
    category: 'single_engine',
    yearManufactured: undefined,
    serialNumber: '',
    maxWeightKg: undefined,
    fuelCapacityLiters: undefined,
    isActive: true,
    isAvailable: true,
    notes: '',
  });

  useEffect(() => {
    if (isEdit && id && token) {
      loadAircraft(id);
    }
  }, [id, token]);

  const loadAircraft = async (aircraftId: string) => {
    if (!token) return;

    try {
      const data = await getAircraftById(aircraftId, token);
      setFormData({
        organizationId: data.organizationId || undefined,
        registration: data.registration,
        type: data.type,
        manufacturer: data.manufacturer || '',
        model: data.model || '',
        category: data.category,
        yearManufactured: data.yearManufactured || undefined,
        maxWeightKg: data.maxWeightKg || undefined,
        fuelCapacityLiters: data.fuelCapacityLiters || undefined,
        isActive: data.isActive ?? true, // Use ?? to handle false correctly
        isAvailable: data.isAvailable ?? true,
        notes: data.notes || '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load aircraft');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setError(null);

    try {
      if (isEdit && id) {
        await updateAircraft(id, formData, token);
      } else {
        await createAircraft(formData, token);
      }
      navigate('/aircraft');
    } catch (err: any) {
      setError(err.message || `Failed to ${isEdit ? 'update' : 'create'} aircraft`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? undefined : parseInt(value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/aircraft')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← {t('aircraft.backToAircraft')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? t('aircraft.editAircraft') : t('aircraft.create')}
          </h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
          {/* Note: organizationId is optional - if not provided, creates personal aircraft */}

          <div className="space-y-6">
            {/* Registration */}
            <div>
              <label
                htmlFor="registration"
                className="block text-sm font-medium text-gray-700"
              >
                {t('aircraft.registration')} *
              </label>
              <input
                type="text"
                id="registration"
                name="registration"
                required
                value={formData.registration}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder={t('aircraft.registrationExample')}
              />
            </div>

            {/* Type */}
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700"
              >
                {t('aircraft.aircraftTypeModel')} * <span className="text-xs text-gray-500">({t('aircraft.typeExample')})</span>
              </label>
              <input
                type="text"
                id="type"
                name="type"
                required
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder={t('aircraft.typeExample')}
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('aircraft.typeHelp')}
              </p>
            </div>

            {/* Manufacturer & Model (optional details) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="manufacturer"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t('aircraft.manufacturer')} <span className="text-xs text-gray-400">({t('aircraft.optional')})</span>
                </label>
                <input
                  type="text"
                  id="manufacturer"
                  name="manufacturer"
                  value={formData.manufacturer || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder={t('aircraft.manufacturerExample')}
                />
              </div>
              <div>
                <label
                  htmlFor="model"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t('aircraft.model')} <span className="text-xs text-gray-400">({t('aircraft.optional')})</span>
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder={t('aircraft.modelExample')}
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700"
              >
                {t('aircraft.category')}
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="single_engine">{t('aircraft.category.singleEngine')}</option>
                <option value="multi_engine">{t('aircraft.category.multiEngine')}</option>
                <option value="helicopter">{t('aircraft.category.helicopter')}</option>
                <option value="glider">{t('aircraft.category.glider')}</option>
                <option value="ultralight">{t('aircraft.category.ultralight')}</option>
              </select>
            </div>

            {/* Year Manufactured */}
            <div>
              <label
                htmlFor="yearManufactured"
                className="block text-sm font-medium text-gray-700"
              >
                {t('aircraft.yearManufactured')} <span className="text-xs text-gray-400">({t('aircraft.optional')})</span>
              </label>
              <input
                type="number"
                id="yearManufactured"
                name="yearManufactured"
                value={formData.yearManufactured ?? ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="2020"
                min="1900"
                max="2100"
              />
            </div>

            {/* Weight & Fuel Capacity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="maxWeightKg"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t('aircraft.maxWeight')} <span className="text-xs text-gray-400">({t('aircraft.optional')})</span>
                </label>
                <input
                  type="number"
                  id="maxWeightKg"
                  name="maxWeightKg"
                  value={formData.maxWeightKg ?? ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="1000"
                />
              </div>
              <div>
                <label
                  htmlFor="fuelCapacityLiters"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t('aircraft.fuelCapacity')} <span className="text-xs text-gray-400">({t('aircraft.optional')})</span>
                </label>
                <input
                  type="number"
                  id="fuelCapacityLiters"
                  name="fuelCapacityLiters"
                  value={formData.fuelCapacityLiters ?? ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="200"
                />
              </div>
            </div>

            {/* Status Checkboxes */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 block text-sm text-gray-900"
                >
                  {t('aircraft.active')}
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAvailable"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isAvailable"
                  className="ml-2 block text-sm text-gray-900"
                >
                  {t('aircraft.availableForUse')}
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700"
              >
                {t('aircraft.notes')}
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder={t('aircraft.notesPlaceholder')}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/aircraft')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting
                ? t('common.saving')
                : isEdit
                ? t('common.save')
                : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
