
import React, { useState } from 'react';
import { BlockData } from '../types';
import SimulationBlock from './SimulationBlock';
import PlusIcon from './icons/PlusIcon';

interface SimulationControlsProps {
  initialCapital: number | '';
  setInitialCapital: (value: number | '') => void;
  numSimulations: number | '';
  setNumSimulations: (value: number | '') => void;
  blocks: BlockData[];
  setBlocks: React.Dispatch<React.SetStateAction<BlockData[]>>;
  onRunSimulation: () => void;
  isLoading: boolean;
}

const GlobalSettingsInput: React.FC<{ label: string; value: number | ''; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; prefix?: string; }> = ({ label, value, onChange, prefix }) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={onChange}
          className={`w-full bg-gray-700 border border-gray-600 rounded-md py-2 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition ${prefix ? 'pl-8' : 'px-3'}`}
        />
      </div>
    </div>
);


const SimulationControls: React.FC<SimulationControlsProps> = ({
  initialCapital, setInitialCapital, numSimulations, setNumSimulations, blocks, setBlocks, onRunSimulation, isLoading
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
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, newBlockData: Partial<BlockData>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...newBlockData } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
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
  
  const totalYears = blocks.reduce((acc, b) => acc + (Number(b.durationYears) || 0), 0);

  return (
    <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col gap-6 p-4 md:p-6">
      <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
        <h2 className="text-lg font-bold text-white mb-4">全体設定</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GlobalSettingsInput
            label="初期資産"
            value={initialCapital}
            onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setInitialCapital(isNaN(val) ? '' : val);
            }}
            prefix="¥"
          />
          <GlobalSettingsInput
            label="シミュレーション回数"
            value={numSimulations}
            onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setNumSimulations(isNaN(val) ? '' : val);
            }}
          />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-4">
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
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4">
        <button 
          onClick={onRunSimulation} 
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3">
          {isLoading ? (
             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
