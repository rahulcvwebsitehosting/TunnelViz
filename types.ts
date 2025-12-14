
export enum TunnelShape {
  Circular = 'Circular',
  Horseshoe = 'Horseshoe',
  Rectangular = 'Rectangular'
}

export enum GeoMaterial {
  SoftClay = 'Soft Clay',
  StiffClay = 'Stiff Clay',
  Sand = 'Sand',
  Gravel = 'Gravel',
  WeatheredRock = 'Weathered Rock',
  SoundRock = 'Sound Rock',
  Granite = 'Granite'
}

export enum ConstructionMethod {
  TBM = 'TBM',
  NATM = 'NATM',
  CutAndCover = 'Cut & Cover'
}

export interface GeologicalLayer {
  id: string;
  type: GeoMaterial;
  thickness: number; // meters
  color: string;
  density: number; // kN/m3
  permeability: 'Low' | 'Medium' | 'High'; // New for GWT logic
  spt_n?: number; // Standard Penetration Test value (Soil)
  rqd?: number; // Rock Quality Designation % (Rock)
}

export interface TunnelDesign {
  shape: TunnelShape;
  width: number; // or diameter
  height: number;
  wallThickness: number;
  depth: number; // invert depth relative to surface
  method: ConstructionMethod; 
  // TBM Params
  segmentCount: number;
  ringWidth: number;
  // NATM Params
  boltLength: number;
  boltSpacing: number;
  // Alignment Params (New)
  horizontalRadius: number; // meters (Infinity for straight)
  verticalGrade: number; // percentage (-5 to +5)
}

export interface SimulationSettings {
  waterTableLevel: number; // Relative to tunnel crown (positive = above)
  natmSequence: number; 
  deviation: number; 
  showStress: boolean;
  showGrouting: boolean;
  showAlignment: boolean;
  showBorehole: boolean; 
  showBMD: boolean; // Bending Moment Diagram
  showSettlement: boolean; // Surface Settlement Frustum
  showHydrostaticVectors: boolean; // New Vector visualization
}

export interface ComparisonMetric {
  method: string;
  cost: number;
  time: number;
  risk: string;
}

export enum AppView {
  Dashboard = 'Dashboard',
  Designer = 'Designer',
  Simulator = 'Simulator',
  Comparator = 'Comparator',
  Learn = 'Learn'
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  type: 'Definition' | 'Concept';
}

export interface Chapter {
  title: string;
  content: string; // HTML/Markdown string
  link?: string; 
}

export interface LearningModule {
  id: string;
  title: string;
  chapters: Chapter[];
  quiz?: Flashcard[];
  requiredXP: number; // New Gamification Gate
}

export interface UserProgress {
    modulesCompleted: number;
    totalModules: number;
    designBadge: boolean;
    geologyBadge: boolean;
    xp: number;
    level: number;
}
