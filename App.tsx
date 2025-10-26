
import React, { useState, useEffect, useCallback } from 'react';
import { BlockData, SimulationResult, FullSimulationResult } from './types';
import { runMonteCarlo } from './services/monteCarloService';
import Header from './components/Header';
import SimulationControls from './components/SimulationControls';
import SimulationChart from './components/SimulationChart';
import HistogramChart from './components/HistogramChart';

const App: React.FC = () => {
  const [initialCapital, setInitialCapital] = useState<number | ''>(0);
  const [numSimulations, setNumSimulations] = useState<number | ''>(10000);
  const [blocks, setBlocks] = useState<BlockData[]>([
    {
      id: 'block-1',
      name: '積立開始',
      durationYears: 2,
      monthlyContribution: 200000,
      annualReturn: 8,
      annualRisk: 16,
      leverage: 1,
    },
    {
      id: 'block-2',
      name: '積極的積立',
      durationYears: 10,
      monthlyContribution: 250000,
      annualReturn: 8,
      annualRisk: 16,
      leverage: 1,
    },
    {
      id: 'block-3',
      name: '支出が増えてきた時期',
      durationYears: 10,
      monthlyContribution: 200000,
      annualReturn: 8,
      annualRisk: 16,
      leverage: 1,
    },
    {
      id: 'block-4',
      name: 'Fireして4%ずつ取り崩し(月2万はお小遣い)',
      durationYears: 40,
      monthlyContribution: -23000,
      annualReturn: 4,
      annualRisk: 16,
      leverage: 1,
    },
  ]);

  const [timeSeriesData, setTimeSeriesData] = useState<SimulationResult>([]);
  const [finalAssets, setFinalAssets] = useState<number[]>([]);
  const [bankruptcyRate, setBankruptcyRate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const handleRunSimulation = useCallback(async () => {
    setIsLoading(true);
    setTimeSeriesData([]); 
    setFinalAssets([]);
    setBankruptcyRate(0);

    const simulationParams = {
      initialCapital: Number(initialCapital) || 0,
      numSimulations: Number(numSimulations) || 0,
      blocks: blocks.map(b => ({
        ...b,
        durationYears: Number(b.durationYears) || 0,
        monthlyContribution: Number(b.monthlyContribution) || 0,
        annualReturn: Number(b.annualReturn) || 0,
        annualRisk: Number(b.annualRisk) || 0,
        leverage: Number(b.leverage) || 1,
      })),
    };

    const results: FullSimulationResult = await runMonteCarlo(simulationParams);
    setTimeSeriesData(results.timeSeries);
    setFinalAssets(results.finalAssets);
    setBankruptcyRate(results.bankruptcyRate);
    setIsLoading(false);
  }, [initialCapital, numSimulations, blocks]);
  
  useEffect(() => {
    handleRunSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run simulation on initial load

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
          blocks={blocks}
          setBlocks={setBlocks}
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
            <SimulationChart data={timeSeriesData} isLoading={isLoading} />
            <HistogramChart data={finalAssets} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
};

export default App;