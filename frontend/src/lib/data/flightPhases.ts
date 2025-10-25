import { FlightPhase } from "../../types";

export const FLIGHT_PHASES: readonly FlightPhase[] = [
  {
    id: "preflight",
    name: "Pre-Flight",
    order: 100,
    icon: "CheckCircle",
    category: "normal",
    description: "Aircraft inspection and preparation before flight",
  },
  {
    id: "startup",
    name: "Startup",
    order: 200,
    icon: "Zap",
    category: "normal",
    description: "Engine start and initial system checks",
  },
  {
    id: "after-startup",
    name: "After Startup",
    order: 300,
    icon: "Play",
    category: "normal",
    description: "Post-engine start procedures and radio checks",
  },
  {
    id: "taxi",
    name: "Taxi",
    order: 400,
    icon: "Car",
    category: "normal",
    description: "Ground movement and taxi procedures",
  },
  {
    id: "runup",
    name: "Run-up",
    order: 500,
    icon: "Gauge",
    category: "normal",
    description: "Engine and system checks before takeoff",
  },
  {
    id: "takeoff",
    name: "Takeoff",
    order: 600,
    icon: "Plane",
    category: "normal",
    description: "Takeoff preparation and execution",
  },
  {
    id: "climb",
    name: "Climb",
    order: 700,
    icon: "TrendingUp",
    category: "normal",
    description: "Initial climb and cruise climb procedures",
  },
  {
    id: "cruise",
    name: "Cruise",
    order: 800,
    icon: "Navigation",
    category: "normal",
    description: "Normal cruise flight operations",
  },
  {
    id: "descent",
    name: "Descent",
    order: 900,
    icon: "TrendingDown",
    category: "normal",
    description: "Descent procedures and preparation for landing",
  },
  {
    id: "approach",
    name: "Approach",
    order: 1000,
    icon: "Crosshair",
    category: "normal",
    description: "Approach preparation and execution",
  },
  {
    id: "final",
    name: "Final",
    order: 1100,
    icon: "Radio",
    category: "normal",
    description: "Final approach and landing preparation",
  },
  {
    id: "landing",
    name: "Landing",
    order: 1200,
    icon: "PlaneLanding",
    category: "normal",
    description: "Landing execution and rollout",
  },
  {
    id: "after-landing",
    name: "After Landing",
    order: 1300,
    icon: "Check",
    category: "normal",
    description: "Post-landing procedures and taxi to parking",
  },
  {
    id: "shutdown",
    name: "Shutdown",
    order: 1400,
    icon: "StopCircle",
    category: "normal",
    description: "Engine shutdown and aircraft securing",
  },
] as const;

export const EMERGENCY_PHASES: readonly FlightPhase[] = [
  {
    id: "emergency",
    name: "Emergency",
    order: 9000,
    icon: "AlertTriangle",
    category: "emergency",
    description: "Emergency procedures and abnormal situations",
  },
  {
    id: "abnormal",
    name: "Abnormal",
    order: 9100,
    icon: "AlertCircle",
    category: "abnormal",
    description: "Abnormal procedures and system malfunctions",
  },
] as const;

export const ALL_PHASES: readonly FlightPhase[] = [
  ...FLIGHT_PHASES,
  ...EMERGENCY_PHASES,
] as const;

export type FlightPhaseId = (typeof ALL_PHASES)[number]["id"];

export function getPhaseById(phaseId: string): FlightPhase | null {
  return ALL_PHASES.find((p) => p.id === phaseId) || null;
}

export function getPhaseOrder(phaseId: string): number {
  const phase = getPhaseById(phaseId);
  return phase ? phase.order : 9999;
}

export function isValidPhase(phaseId: string): boolean {
  return ALL_PHASES.some((p) => p.id === phaseId);
}

export function getPhaseIcon(phaseId: string): string {
  const phase = getPhaseById(phaseId);
  return phase ? phase.icon : "List";
}

export function getPhaseName(phaseId: string): string {
  const phase = getPhaseById(phaseId);
  return phase ? phase.name : phaseId;
}

export function getPhaseDescription(phaseId: string): string {
  const phase = getPhaseById(phaseId);
  return phase ? phase.description || "" : "";
}

export function getPhasesByCategory(
  category: "normal" | "emergency" | "abnormal",
): FlightPhase[] {
  return ALL_PHASES.filter((phase) => phase.category === category);
}

export function getNormalPhases(): FlightPhase[] {
  return [...FLIGHT_PHASES];
}

export function getEmergencyPhases(): FlightPhase[] {
  return [...EMERGENCY_PHASES];
}

export function sortPhasesByOrder(phases: FlightPhase[]): FlightPhase[] {
  return [...phases].sort((a, b) => a.order - b.order);
}
