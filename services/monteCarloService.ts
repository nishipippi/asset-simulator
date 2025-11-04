
import { SimulationParams, FullSimulationResult } from '../types';

// Uses the Box-Muller transform to generate a normally distributed random number.
function generateNormalRandom(mean: number, stdDev: number): number {
  let u1 = 0, u2 = 0;
  //Ensure u1 and u2 are not 0, which would cause Math.log(0) to be -Infinity
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();

  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  // z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2); // we only need one
  return z0 * stdDev + mean;
}

export const runMonteCarlo = (params: SimulationParams): Promise<FullSimulationResult> => {
  return new Promise((resolve) => {
    const { initialCapital, blocks, spotPayments, numSimulations } = params;

    if (blocks.length === 0 || numSimulations === 0) {
      const finalAssets = [initialCapital];
      const timeSeries = blocks.length === 0 ? [{ year: 0, p10: initialCapital, p25: initialCapital, median: initialCapital, p75: initialCapital, p90: initialCapital }] : [];
      resolve({ timeSeries, finalAssets, bankruptcyRate: initialCapital <= 0 ? 100 : 0 });
      return;
    }

    const monthlyBlocks = blocks.map(block => {
      const leverage = Number((block as any).leverage) || 1;
      const annualReturn = (Number(block.annualReturn) || 0) / 100;
      const annualRisk = (Number(block.annualRisk) || 0) / 100;

      const leveragedAnnualReturn = leverage * annualReturn;
      const leveragedAnnualRisk = leverage * annualRisk;
      
      return {
        ...block,
        monthlyContribution: Number(block.monthlyContribution) || 0,
        monthlyReturn: leveragedAnnualReturn / 12,
        monthlyRisk: leveragedAnnualRisk / Math.sqrt(12),
        durationMonths: (Number(block.durationYears) || 0) * 12,
      };
    });

    const totalMonths = monthlyBlocks.reduce((acc, block) => acc + block.durationMonths, 0);
    const totalYears = Math.floor(totalMonths / 12);

    const yearlyCapitalSnapshots: number[][] = Array.from({ length: totalYears + 1 }, () => []);
    const finalAssets: number[] = [];

    for (let i = 0; i < numSimulations; i++) {
      let currentCapital = initialCapital;
      let monthCounter = 0;

      if (yearlyCapitalSnapshots[0]) {
          yearlyCapitalSnapshots[0].push(initialCapital);
      }

      for (const block of monthlyBlocks) {
        for (let m = 0; m < block.durationMonths; m++) {
          // Only apply returns if capital is positive
          if (currentCapital > 0) {
            const randomReturn = generateNormalRandom(block.monthlyReturn, block.monthlyRisk);
            currentCapital *= (1 + randomReturn);
          }
          
          // Always apply contribution/withdrawal
          currentCapital += block.monthlyContribution;

          monthCounter++;

          if (monthCounter % 12 === 0) {
            const year = monthCounter / 12;
            
            // Apply spot payments for this year
            if (spotPayments) {
                const paymentsForThisYear = spotPayments.filter(p => Number(p.year) === year);
                for (const payment of paymentsForThisYear) {
                    currentCapital += Number(payment.amount) || 0;
                }
            }

            if (year <= totalYears && yearlyCapitalSnapshots[year]) {
              yearlyCapitalSnapshots[year].push(currentCapital);
            }
          }
        }
      }
      finalAssets.push(currentCapital);
    }
    
    const timeSeries: FullSimulationResult['timeSeries'] = [];
    for (let y = 0; y <= totalYears; y++) {
      const sortedYearlyCapital = [...(yearlyCapitalSnapshots[y] || [])].sort((a, b) => a - b);
      if (sortedYearlyCapital.length === 0) continue;
      
      const p10Index = Math.floor(sortedYearlyCapital.length * 0.10);
      const p25Index = Math.floor(sortedYearlyCapital.length * 0.25);
      const medianIndex = Math.floor(sortedYearlyCapital.length * 0.50);
      const p75Index = Math.floor(sortedYearlyCapital.length * 0.75);
      const p90Index = Math.floor(sortedYearlyCapital.length * 0.90);

      timeSeries.push({
        year: y,
        p10: sortedYearlyCapital[p10Index] ?? 0,
        p25: sortedYearlyCapital[p25Index] ?? 0,
        median: sortedYearlyCapital[medianIndex] ?? 0,
        p75: sortedYearlyCapital[p75Index] ?? 0,
        p90: sortedYearlyCapital[p90Index] ?? 0,
      });
    }
    
    const bankruptCount = finalAssets.filter(asset => asset <= 0).length;
    const bankruptcyRate = numSimulations > 0 ? (bankruptCount / numSimulations) * 100 : 0;

    resolve({ timeSeries, finalAssets, bankruptcyRate });
  });
};