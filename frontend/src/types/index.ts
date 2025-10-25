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
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
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
}

// ----------------------------------------------------------------------------
// AIRCRAFT
// ----------------------------------------------------------------------------

export type AircraftCategory =
  | "SEP"
  | "MEP"
  | "JET"
  | "UL"
  | "HELI"
  | "GLIDER"
  | "OTHER";

export interface AircraftType {
  id: string;
  name: string;
  manufacturer: string;
  category: AircraftCategory;
  description?: string;
  isCustom: boolean;
}

export type OwnerType = "user" | "organization";
export type AircraftStatus = "airworthy" | "maintenance" | "grounded";

export interface Aircraft {
  id: string;
  aircraftTypeId: string;
  ownerType: OwnerType;
  ownerUserId?: string;
  ownerOrgId?: string;
  registration?: string;
  callsign: string;
  hobbsTime?: number;
  tachTime?: number;
  status: AircraftStatus;
  createdAt: Date;
  updatedAt: Date;
  aircraftType?: AircraftType;
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
  ownerType: OwnerType;
  ownerUserId?: string;
  ownerOrgId?: string;
  aircraftId?: string;
  aircraftTypeId?: string;
  title: string;
  description?: string;
  category: ChecklistCategory;
  phase: string;
  sequenceInPhase: number;
  version: string;
  status: ChecklistStatus;
  isTemplate: boolean;
  parentChecklistId?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  createdBy: string;
  updatedBy?: string;
  items?: ChecklistItem[];
  aircraft?: Aircraft;
  aircraftType?: AircraftType;
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  sequenceNumber: number;
  text: string;
  action: string;
  expectedResponse?: string;
  isCritical: boolean;
  notes?: string;
  voiceEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
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
