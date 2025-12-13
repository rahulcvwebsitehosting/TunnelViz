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

export interface GeologicalLayer {
  id: string;
  type: GeoMaterial;
  thickness: number; // meters
  color: string;
  density: number; // kN/m3
}

export interface TunnelDesign {
  shape: TunnelShape;
  width: number; // or diameter
  height: number;
  wallThickness: number;
  depth: number; // invert depth relative to surface
}

export interface ComparisonMetric {
  method: string;
  cost: number;
  time: number;
  risk: string;
}

export enum AppView {
  Designer = 'Designer',
  Simulator = 'Simulator',
  Comparator = 'Comparator',
  Learn = 'Learn'
}
