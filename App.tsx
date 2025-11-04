
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BlockData, SimulationResult, FullSimulationResult, SpotPayment } from './types';
import { runMonteCarlo } from './services/monteCarloService';
import Header from './components/Header';
import SimulationControls from './components/SimulationControls';
import SimulationChart from './components/SimulationChart';
import HistogramChart from './components/HistogramChart';

const App: React.FC = () => {
  const [initialCapital, setInitialCapital] = useState<number | ''>(0);
  const [numSimulations, setNumSimulations] = useState<number | ''>(10000);
  const [inflationRate, setInflationRate] = useState<number | ''>(2);
  const [blocks, setBlocks] = useState<BlockData[]>([
    {
      id: 'block-1',
      name: '積立開始',
      durationYears: 2,
      monthlyContribution: 200000,
      annualReturn: 8,
      annualRisk: 16,
      leverage: 1,
      increaseWithInflation: false,
    },
    {
      id: 'block-2',
      name: '積極的積立',
      durationYears: 10,
      monthlyContribution: 250000,
      annualReturn: 8,
      annualRisk: 16,
      leverage: 1,
      increaseWithInflation: true,
    },
    {
      id: 'block-3',
      name: '支出が増えてきた時期',
      durationYears: 10,
      monthlyContribution: 200000,
      annualReturn: 8,
      annualRisk: 16,
      leverage: 1,
      increaseWithInflation: true,
    },
    {
      id: 'block-4',
      name: 'Fireして4%ずつ取り崩し(月2万はお小遣い)',
      durationYears: 40,
      monthlyContribution: -23000,
      annualReturn: 4,
      annualRisk: 16,
      leverage: 1,
      increaseWithInflation: true,
    },
  ]);
  const [spotPayments, setSpotPayments] = useState<SpotPayment[]>([
      {
          id: 'sp-1',
          name: '車の購入',
          year: 5,
          amount: -2000000
      }
  ]);

  const [timeSeriesData, setTimeSeriesData] = useState<SimulationResult>([]);
  const [finalAssets, setFinalAssets] = useState<number[]>([]);
  const [bankruptcyRate, setBankruptcyRate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [valueType, setValueType] = useState<'nominal' | 'real'>('nominal');

  const handleRunSimulation = useCallback(async () => {
    setIsLoading(true);
    setTimeSeriesData([]); 
    setFinalAssets([]);
    setBankruptcyRate(0);

    const simulationParams = {
      initialCapital: Number(initialCapital) || 0,
      numSimulations: Number(numSimulations) || 0,
      inflationRate: Number(inflationRate) || 0,
      blocks: blocks.map(b => ({
        ...b,
        durationYears: Number(b.durationYears) || 0,
        monthlyContribution: Number(b.monthlyContribution) || 0,
        annualReturn: Number(b.annualReturn) || 0,
        annualRisk: Number(b.annualRisk) || 0,
        leverage: Number(b.leverage) || 1,
      })),
      spotPayments: spotPayments.map(p => ({
        ...p,
        year: Number(p.year) || 0,
        amount: Number(p.amount) || 0,
      })),
    };

    const results: FullSimulationResult = await runMonteCarlo(simulationParams);
    setTimeSeriesData(results.timeSeries);
    setFinalAssets(results.finalAssets);
    setBankruptcyRate(results.bankruptcyRate);
    setIsLoading(false);
  }, [initialCapital, numSimulations, blocks, spotPayments, inflationRate]);
  
  useEffect(() => {
    handleRunSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run simulation on initial load

  const totalYears = useMemo(() => blocks.reduce((acc, b) => acc + (Number(b.durationYears) || 0), 0), [blocks]);

  const displayTimeSeriesData = useMemo(() => {
      if (valueType === 'nominal' || !timeSeriesData) {
          return timeSeriesData;
      }
      const annualInflationRate = (Number(inflationRate) || 0) / 100;
      return timeSeriesData.map(point => ({
          ...point,
          p10: point.p10 / Math.pow(1 + annualInflationRate, point.year),
          p25: point.p25 / Math.pow(1 + annualInflationRate, point.year),
          median: point.median / Math.pow(1 + annualInflationRate, point.year),
          p75: point.p75 / Math.pow(1 + annualInflationRate, point.year),
          p90: point.p90 / Math.pow(1 + annualInflationRate, point.year),
      }));
  }, [timeSeriesData, valueType, inflationRate]);

  const displayFinalAssets = useMemo(() => {
      if (valueType === 'nominal' || !finalAssets) {
          return finalAssets;
      }
      const annualInflationRate = (Number(inflationRate) || 0) / 100;
      const discountFactor = Math.pow(1 + annualInflationRate, totalYears);
      return finalAssets.map(asset => asset / discountFactor);
  }, [finalAssets, valueType, inflationRate, totalYears]);


  const getBankruptcyColor = (rate: number) => {
    if (rate > 20) return 'text-red-400';
    if (rate > 5) return 'text-yellow-400';
    return 'text-green-400';
  };
  
  const getBankruptcyBgColor = (rate: number) => {
    if (rate > 20) return 'bg-red-400/10';
    if (rate > 5) return 'bg-yellow-400/10';
    return 'bg-green-400/10';
  };

  const getBankruptcyLabel = (rate: number) => {
    if (rate > 20) return '危険';
    if (rate > 5) return '注意';
    return '安全';
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col lg:flex-row container mx-auto w-full p-2 md:p-4 gap-6">
        <SimulationControls
          initialCapital={initialCapital}
          setInitialCapital={setInitialCapital}
          numSimulations={numSimulations}
          setNumSimulations={setNumSimulations}
          inflationRate={inflationRate}
          setInflationRate={setInflationRate}
          blocks={blocks}
          setBlocks={setBlocks}
          spotPayments={spotPayments}
          setSpotPayments={setSpotPayments}
          onRunSimulation={handleRunSimulation}
          isLoading={isLoading}
        />
        <div className="flex-1 flex flex-col lg:w-1/2 xl:w-3/5 gap-6">
            { !isLoading && timeSeriesData.length > 0 && (
                <div className="bg-gray-800 p-4 rounded-xl shadow-lg text-center">
                    <h3 className="text-base font-bold text-white mb-2">リスク評価：破綻率</h3>
                    <p className={`text-5xl font-bold my-1 ${getBankruptcyColor(bankruptcyRate)}`}>
                        {bankruptcyRate.toFixed(2)}%
                    </p>
                    <p className="text-gray-400 text-sm mb-2">最終資産が0円以下になる確率</p>
                     <div className={`mt-1 text-sm font-semibold py-1 px-3 inline-block rounded-full ${getBankruptcyBgColor(bankruptcyRate)} ${getBankruptcyColor(bankruptcyRate)}`}>
                        {getBankruptcyLabel(bankruptcyRate)}
                    </div>
                </div>
            )}

            { !isLoading && timeSeriesData.length > 0 && (
                <div className="flex justify-center items-center gap-4 bg-gray-800 p-2 rounded-lg">
                    <span className={`font-semibold transition-colors ${valueType === 'nominal' ? 'text-cyan-400' : 'text-gray-400'}`}>名目価値</span>
                    <button 
                        onClick={() => setValueType(vt => vt === 'nominal' ? 'real' : 'nominal')}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 ${valueType === 'real' ? 'bg-cyan-600' : 'bg-gray-600'}`}
                        role="switch"
                        aria-checked={valueType === 'real'}
                    >
                        <span aria-hidden="true" className={`inline-block h-5 w-5 rounded-full bg-white shadow-lg transform ring-0 transition ease-in-out duration-200 ${valueType === 'real' ? 'translate-x-5' : 'translate-x-0'}`}></span>
                    </button>
                    <span className={`font-semibold transition-colors ${valueType === 'real' ? 'text-cyan-400' : 'text-gray-400'}`}>実質価値</span>
                </div>
            )}
            
            <SimulationChart data={displayTimeSeriesData} isLoading={isLoading} />
            <HistogramChart data={displayFinalAssets} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
};

export default App;