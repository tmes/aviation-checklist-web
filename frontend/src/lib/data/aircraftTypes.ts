import { AircraftType } from "../../types";

export const DEFAULT_AIRCRAFT_TYPES: AircraftType[] = [
  {
    id: "robin-dr401",
    name: "Robin DR-401",
    manufacturer: "Robin Aircraft",
    category: "SEP",
    description: "Single Engine Piston - 4 Seat Touring Aircraft",
    isCustom: false,
  },
  {
    id: "cessna-172",
    name: "Cessna 172",
    manufacturer: "Cessna",
    category: "SEP",
    description: "Single Engine Piston - Training Aircraft",
    isCustom: false,
  },
  {
    id: "piper-pa28",
    name: "Piper PA-28",
    manufacturer: "Piper",
    category: "SEP",
    description: "Single Engine Piston - Cherokee Series",
    isCustom: false,
  },
  {
    id: "cessna-152",
    name: "Cessna 152",
    manufacturer: "Cessna",
    category: "SEP",
    description: "Single Engine Piston - Primary Trainer",
    isCustom: false,
  },
  {
    id: "beechcraft-c23",
    name: "Beechcraft Sundowner C23",
    manufacturer: "Beechcraft",
    category: "SEP",
    description: "Single Engine Piston - 4 Seat Aircraft",
    isCustom: false,
  },
  {
    id: "diamond-da40",
    name: "Diamond DA40",
    manufacturer: "Diamond Aircraft",
    category: "SEP",
    description: "Single Engine Piston - Modern Training Aircraft",
    isCustom: false,
  },
  {
    id: "cirrus-sr22",
    name: "Cirrus SR22",
    manufacturer: "Cirrus Aircraft",
    category: "SEP",
    description: "Single Engine Piston - High Performance with Parachute",
    isCustom: false,
  },
  {
    id: "tecnam-p2008",
    name: "Tecnam P2008",
    manufacturer: "Tecnam",
    category: "UL",
    description: "Ultralight - Modern LSA Aircraft",
    isCustom: false,
  },
];

/**
 * Get aircraft type by ID
 */
export function getAircraftTypeById(id: string): AircraftType | null {
  return DEFAULT_AIRCRAFT_TYPES.find((type) => type.id === id) || null;
}

/**
 * Get all aircraft types for a specific category
 */
export function getAircraftTypesByCategory(category: string): AircraftType[] {
  return DEFAULT_AIRCRAFT_TYPES.filter((type) => type.category === category);
}

/**
 * Search aircraft types by name or manufacturer
 */
export function searchAircraftTypes(query: string): AircraftType[] {
  const lowerQuery = query.toLowerCase();
  return DEFAULT_AIRCRAFT_TYPES.filter(
    (type) =>
      type.name.toLowerCase().includes(lowerQuery) ||
      type.manufacturer.toLowerCase().includes(lowerQuery),
  );
}
