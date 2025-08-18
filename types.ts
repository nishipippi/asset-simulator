
export interface BlockData {
  id: string;
  name: string;
  durationYears: number | '';
  monthlyContribution: number | '';
  annualReturn: number | '';
  annualRisk: number | '';
}

export interface SimulationParams {
  initialCapital: number;
  blocks: (Omit<BlockData, 'id' | 'name'> & { name: string, id: string })[];
  numSimulations: number;
}

export interface SimulationDataPoint {
  year: number;
  p25: number;
  median: number;
  p75: number;
}

export type SimulationResult = SimulationDataPoint[];

export interface FullSimulationResult {
  timeSeries: SimulationResult;
  finalAssets: number[];
  bankruptcyRate: number;
}
