// ============================================================================
// AEROCHECK - TYPE DEFINITIONS
// ============================================================================

// ----------------------------------------------------------------------------
// AUTH & USERS
// ----------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  languagePreference?: string;
  darkMode?: boolean;
  emailVerified: boolean;
  isSuperAdmin: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  languagePreference?: string;
}

// ----------------------------------------------------------------------------
// AIRCRAFT
// ----------------------------------------------------------------------------

export type AircraftCategory =
  | "single_engine"
  | "multi_engine"
  | "helicopter"
  | "glider"
  | "ultralight";

export interface Aircraft {
  id: string;
  organizationId?: string | null;
  ownerUserId?: string | null;
  organizationName?: string;
  registration: string;
  type: string;
  manufacturer?: string;
  model?: string;
  category: AircraftCategory;
  yearManufactured?: number;
  serialNumber?: string;
  maxWeightKg?: number;
  fuelCapacityLiters?: number;
  isActive: boolean;
  isAvailable: boolean;
  notes?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAircraftData {
  organizationId?: string; // Optional - if not provided, creates personal aircraft
  registration: string;
  type: string;
  manufacturer?: string;
  model?: string;
  category?: AircraftCategory;
  yearManufactured?: number;
  serialNumber?: string;
  maxWeightKg?: number;
  fuelCapacityLiters?: number;
  isActive?: boolean;
  isAvailable?: boolean;
  notes?: string;
  photoUrl?: string;
}

export interface UpdateAircraftData {
  registration?: string;
  type?: string;
  manufacturer?: string;
  model?: string;
  category?: AircraftCategory;
  yearManufactured?: number;
  serialNumber?: string;
  maxWeightKg?: number;
  fuelCapacityLiters?: number;
  isActive?: boolean;
  isAvailable?: boolean;
  notes?: string;
  photoUrl?: string;
}

// ----------------------------------------------------------------------------
// FLIGHT PHASES
// ----------------------------------------------------------------------------

export type PhaseCategory = "normal" | "emergency" | "abnormal";

export interface FlightPhase {
  id: string;
  name: string;
  order: number;
  icon: string;
  category: PhaseCategory;
  description?: string;
}

// ----------------------------------------------------------------------------
// CHECKLISTS
// ----------------------------------------------------------------------------

export type ChecklistCategory = "normal" | "emergency" | "abnormal";
export type ChecklistStatus = "draft" | "published" | "archived";

export interface Checklist {
  id: string;
  organizationId?: string | null;
  ownerUserId?: string | null;
  aircraftId?: string | null;
  templateId?: string | null;
  name: string;
  description?: string | null;
  currentVersion?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  // Joined data from backend
  aircraftRegistration?: string;
  aircraftType?: string;
  organizationName?: string;
  itemCount?: number;
  items?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  phase: ChecklistPhase;
  itemText: string;
  expectedValue?: string | null;
  sortOrder: number;
  isCritical: boolean;
  requiresConfirmation: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ChecklistPhase =
  | "pre_flight"
  | "startup"
  | "taxi"
  | "before_takeoff"
  | "takeoff"
  | "climb"
  | "cruise"
  | "descent"
  | "approach"
  | "landing"
  | "after_landing"
  | "shutdown"
  | "post_flight"
  | "emergency";

export interface CreateChecklistData {
  organizationId?: string;
  aircraftId?: string;
  name: string;
  description?: string;
  items?: {
    phase: ChecklistPhase;
    itemText: string;
    expectedValue?: string;
    sortOrder?: number;
    isCritical?: boolean;
    requiresConfirmation?: boolean;
  }[];
}

export interface UpdateChecklistData {
  name?: string;
  description?: string;
  aircraftId?: string;
  isActive?: boolean;
  items?: {
    phase: ChecklistPhase;
    itemText: string;
    expectedValue?: string;
    sortOrder?: number;
    isCritical?: boolean;
    requiresConfirmation?: boolean;
  }[];
}

// ----------------------------------------------------------------------------
// CHECKLIST EXECUTION & PROGRESS
// ----------------------------------------------------------------------------

export type ExecutionStatus = "in_progress" | "completed" | "aborted";
export type FlightType = "training" | "solo" | "dual" | "commercial" | "other";

export interface ChecklistExecution {
  id: string;
  userId: string;
  checklistId: string;
  aircraftId?: string;
  startedAt: Date;
  completedAt?: Date;
  status: ExecutionStatus;
  flightType?: FlightType;
  weatherConditions?: string;
  notes?: string;
  actions?: ChecklistItemAction[];
}

export type ItemActionType = "completed" | "skipped" | "deferred" | "failed";
export type SkipReason =
  | "not_applicable"
  | "emergency"
  | "instructor_override"
  | "weather_dependent"
  | "equipment_unavailable"
  | "custom";

export interface ChecklistItemAction {
  id: string;
  executionId: string;
  checklistItemId: string;
  action: ItemActionType;
  timestamp: Date;
  reason?: SkipReason;
  reasonText?: string;
  authorizedBy?: string;
  actualResponse?: string;
  durationSeconds?: number;
  voiceConfirmed: boolean;
}

// ----------------------------------------------------------------------------
// USER SETTINGS
// ----------------------------------------------------------------------------

export interface UserSettings {
  userId: string;
  darkMode: boolean;
  voiceEnabled: boolean;
  activeAircraftId?: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  shareProgressWithOrg: boolean;
}

// ----------------------------------------------------------------------------
// UI HELPER TYPES
// ----------------------------------------------------------------------------

export interface ChecklistSummary {
  id: string;
  title: string;
  category: ChecklistCategory;
  phase: string;
  sequenceInPhase: number;
  totalItems: number;
  completedItems: number;
  progressPercentage: number;
  icon: string;
  ownerType: OwnerType;
  isPublished: boolean;
  lastUsed?: Date;
}

export interface ChecklistGroup {
  phase: FlightPhase;
  checklists: ChecklistSummary[];
}

// ----------------------------------------------------------------------------
// API TYPES
// ----------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
}

// ----------------------------------------------------------------------------
// IMPORT/EXPORT TYPES
// ----------------------------------------------------------------------------

export interface ImportResult {
  success: Checklist[];
  errors: string[];
  warnings: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CSVRow {
  title: string;
  text: string;
  action: string;
  critical: string;
  voiceCommand?: string;
  notes?: string;
  phase?: string;
}
