
export interface BlockData {
  id: string;
  name: string;
  durationYears: number | '';
  monthlyContribution: number | '';
  annualReturn: number | '';
  annualRisk: number | '';
  leverage: number | '';
}

export interface SpotPayment {
  id: string;
  name: string;
  year: number | '';
  amount: number | '';
}

export interface SimulationParams {
  initialCapital: number;
  blocks: (Omit<BlockData, 'id' | 'name'> & { name: string, id: string })[];
  spotPayments: (Omit<SpotPayment, 'id' | 'name'> & { name: string, id: string })[];
  numSimulations: number;
}

export interface SimulationDataPoint {
  year: number;
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
}

export type SimulationResult = SimulationDataPoint[];

export interface FullSimulationResult {
  timeSeries: SimulationResult;
  finalAssets: number[];
  bankruptcyRate: number;
}