
import React, { useState } from 'react';
import { BlockData, SpotPayment } from '../types';
import SimulationBlock from './SimulationBlock';
import SpotPaymentItem from './SpotPaymentItem';
import PlusIcon from './icons/PlusIcon';

interface SimulationControlsProps {
  initialCapital: number | '';
  setInitialCapital: (value: number | '') => void;
  numSimulations: number | '';
  setNumSimulations: (value: number | '') => void;
  inflationRate: number | '';
  setInflationRate: (value: number | '') => void;
  blocks: BlockData[];
  setBlocks: React.Dispatch<React.SetStateAction<BlockData[]>>;
  spotPayments: SpotPayment[];
  setSpotPayments: React.Dispatch<React.SetStateAction<SpotPayment[]>>;
  onRunSimulation: () => void;
  isLoading: boolean;
}

const GlobalSettingsInput: React.FC<{ label: string; value: number | ''; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; prefix?: string; suffix?: string; step?: number; }> = ({ label, value, onChange, prefix, suffix, step = 1 }) => {
    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
        e.preventDefault();

        const currentValue = parseFloat(String(value)) || 0;
        
        let effectiveStep = step;
         if (step >= 100) {
            if (Math.abs(currentValue) >= 1000000) {
                effectiveStep = 100000;
            } else if (Math.abs(currentValue) >= 100000) {
                effectiveStep = 10000;
            }
        }
        
        const isScrollingUp = e.deltaY < 0;
        let newValue = isScrollingUp ? currentValue + effectiveStep : currentValue - effectiveStep;

        if (step % 1 !== 0) {
            const precision = String(step).split('.')[1]?.length || 2;
            newValue = parseFloat(newValue.toFixed(precision));
        }

        const syntheticEvent = {
            target: { value: String(newValue) }
        } as React.ChangeEvent<HTMLInputElement>;

        onChange(syntheticEvent);
    };

    return (
        <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <div className="relative">
            {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{prefix}</span>}
            <input
            type="number"
            value={value}
            onChange={onChange}
            onWheel={handleWheel}
            className={`w-full bg-gray-700 border border-gray-600 rounded-md py-2 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition ${prefix ? 'pl-8' : 'px-3'} ${suffix ? 'pr-8' : ''}`}
            />
            {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{suffix}</span>}
        </div>
        </div>
    );
};


const SimulationControls: React.FC<SimulationControlsProps> = ({
  initialCapital, setInitialCapital, numSimulations, setNumSimulations, inflationRate, setInflationRate, blocks, setBlocks, spotPayments, setSpotPayments, onRunSimulation, isLoading
}) => {
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addBlock = () => {
    const newBlock: BlockData = {
      id: `block-${Date.now()}`,
      name: '新規フェーズ',
      durationYears: 10,
      monthlyContribution: 50000,
      annualReturn: 7,
      annualRisk: 15,
      leverage: 1,
      increaseWithInflation: false,
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, newBlockData: Partial<BlockData>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...newBlockData } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };
  
  const addSpotPayment = () => {
    const newPayment: SpotPayment = {
      id: `sp-${Date.now()}`,
      name: '新規イベント',
      year: 5,
      amount: -1000000,
    };
    setSpotPayments([...spotPayments, newPayment]);
  };
  
  const updateSpotPayment = (id: string, newPaymentData: Partial<SpotPayment>) => {
    setSpotPayments(spotPayments.map(p => p.id === id ? { ...p, ...newPaymentData } : p));
  };

  const removeSpotPayment = (id: string) => {
    setSpotPayments(spotPayments.filter(p => p.id !== id));
  };


  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newBlocks = [...blocks];
    const draggedItem = newBlocks.splice(draggedIndex, 1)[0];
    newBlocks.splice(index, 0, draggedItem);
    
    setBlocks(newBlocks);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };
  
  const handleStandardize = (sourceId: string) => {
    const sourceBlock = blocks.find(b => b.id === sourceId);
    if (!sourceBlock) return;

    const { annualReturn, annualRisk, leverage } = sourceBlock;

    setBlocks(currentBlocks => 
      currentBlocks.map(block => ({
        ...block,
        annualReturn,
        annualRisk,
        leverage,
      }))
    );
  };

  const totalYears = blocks.reduce((acc, b) => acc + (Number(b.durationYears) || 0), 0);

  return (
    <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col gap-6 p-4 md:p-6">
      <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
        <h2 className="text-lg font-bold text-white mb-4">全体設定</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlobalSettingsInput
            label="初期資産"
            value={initialCapital}
            onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setInitialCapital(isNaN(val) ? '' : val);
            }}
            prefix="¥"
            step={10000}
          />
          <GlobalSettingsInput
            label="シミュレーション回数"
            value={numSimulations}
            onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setNumSimulations(isNaN(val) ? '' : val);
            }}
            step={100}
          />
          <GlobalSettingsInput
            label="年間の想定インフレ率"
            value={inflationRate}
            onChange={(e) => {
                const val = parseFloat(e.target.value);
                setInflationRate(isNaN(val) ? '' : val);
            }}
            suffix="%"
            step={0.1}
          />
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">資産計画 (合計: {totalYears}年)</h2>
            <button onClick={addBlock} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                <PlusIcon className="w-5 h-5"/>
                フェーズを追加
            </button>
        </div>
        <div className="space-y-3">
          {blocks.map((block, index) => (
            <div
              key={block.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`transition-all ${draggedIndex === index ? 'opacity-50 scale-105' : 'opacity-100'}`}
            >
              <SimulationBlock
                block={block}
                onUpdate={updateBlock}
                onRemove={removeBlock}
                onStandardize={handleStandardize}
              />
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">スポットイベント</h2>
            <button onClick={addSpotPayment} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                <PlusIcon className="w-5 h-5"/>
                イベントを追加
            </button>
        </div>
        <div className="space-y-3">
          {spotPayments.map((payment) => (
            <SpotPaymentItem
              key={payment.id}
              payment={payment}
              onUpdate={updateSpotPayment}
              onRemove={removeSpotPayment}
            />
          ))}
        </div>
      </div>


      <div className="mt-auto pt-4">
        <button 
          onClick={onRunSimulation} 
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3">
          {isLoading ? (
             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : 'シミュレーション実行'}
        </button>
      </div>
    </div>
  );
};

export default SimulationControls;
