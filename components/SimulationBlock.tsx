
import React from 'react';
import { BlockData } from '../types';
import TrashIcon from './icons/TrashIcon';
import GripVerticalIcon from './icons/GripVerticalIcon';

interface SimulationBlockProps {
  block: BlockData;
  onUpdate: (id: string, newBlockData: Partial<BlockData>) => void;
  onRemove: (id:string) => void;
}

const InputField: React.FC<{ label: string; value: number | string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; suffix?: string; placeholder?: string }> = ({ label, value, onChange, type = 'number', suffix, placeholder }) => (
  <div className="flex-1">
    <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-gray-700 border border-gray-600 rounded-md py-1.5 px-3 text-gray-200 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
      />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{suffix}</span>}
    </div>
  </div>
);

const SimulationBlock: React.FC<SimulationBlockProps> = ({ block, onUpdate, onRemove }) => {
  const isWithdrawal = Number(block.monthlyContribution) < 0;

  return (
    <div className={`bg-gray-800 border-l-4 ${isWithdrawal ? 'border-red-500' : 'border-green-500'} rounded-r-lg p-4 shadow-md flex items-start gap-3`}>
      <div className="cursor-grab text-gray-500 hover:text-gray-300 transition-colors py-2">
        <GripVerticalIcon className="w-6 h-6" />
      </div>
      <div className="flex-1 space-y-4">
        <input
            type="text"
            value={block.name}
            onChange={(e) => onUpdate(block.id, { name: e.target.value })}
            placeholder="フェーズ名（例：積立期間）"
            className="w-full bg-transparent text-lg font-bold text-white placeholder-gray-500 focus:outline-none"
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InputField
              label="期間"
              value={block.durationYears}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                onUpdate(block.id, { durationYears: isNaN(val) ? '' : val });
              }}
              suffix="年"
            />
            <InputField
              label="毎月の積立/取崩額"
              value={block.monthlyContribution}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                onUpdate(block.id, { monthlyContribution: isNaN(val) ? '' : val });
              }}
              suffix="円"
            />
            <InputField
              label="年次リターン"
              value={block.annualReturn}
              onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdate(block.id, { annualReturn: isNaN(val) ? '' : val });
              }}
              suffix="%"
            />
            <InputField
              label="年次リスク"
              value={block.annualRisk}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdate(block.id, { annualRisk: isNaN(val) ? '' : val });
              }}
              suffix="%"
            />
        </div>
      </div>
      <button onClick={() => onRemove(block.id)} className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded-full">
        <TrashIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default SimulationBlock;
