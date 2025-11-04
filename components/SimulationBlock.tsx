
import React from 'react';
import { BlockData } from '../types';
import TrashIcon from './icons/TrashIcon';
import GripVerticalIcon from './icons/GripVerticalIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';

interface SimulationBlockProps {
  block: BlockData;
  onUpdate: (id: string, newBlockData: Partial<BlockData>) => void;
  onRemove: (id:string) => void;
  onStandardize: (id: string) => void;
}

const InputField: React.FC<{ label: string; value: number | string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; suffix?: string; placeholder?: string; step?: number; }> = ({ label, value, onChange, type = 'number', suffix, placeholder, step = 1 }) => {
    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
        if (type !== 'number') return;
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
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
        <div className="relative">
          <input
            type={type}
            value={value}
            onChange={onChange}
            onWheel={handleWheel}
            placeholder={placeholder}
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-1.5 px-3 text-gray-200 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
          />
          {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{suffix}</span>}
        </div>
      </div>
    );
};

const SimulationBlock: React.FC<SimulationBlockProps> = ({ block, onUpdate, onRemove, onStandardize }) => {
  const isWithdrawal = Number(block.monthlyContribution) < 0;

  return (
    <div className={`bg-gray-800 border-l-4 ${isWithdrawal ? 'border-red-500' : 'border-green-500'} rounded-r-lg p-4 shadow-md flex items-start gap-3`}>
      <div className="cursor-grab text-gray-500 hover:text-gray-300 transition-colors py-2">
        <GripVerticalIcon className="w-6 h-6" />
      </div>
      <div className="flex-1 space-y-4 min-w-0">
        <div className="flex items-center gap-2 justify-between">
            <input
                type="text"
                value={block.name}
                onChange={(e) => onUpdate(block.id, { name: e.target.value })}
                placeholder="フェーズ名（例：積立期間）"
                className="flex-grow bg-transparent text-lg font-bold text-white placeholder-gray-500 focus:outline-none min-w-0"
            />
            <button
                onClick={() => onStandardize(block.id)}
                title="投資商品を全フェーズこれに統一"
                className="group relative flex-shrink-0 text-gray-500 hover:text-cyan-400 transition-colors p-1 rounded-full"
            >
                <ClipboardDocumentListIcon className="w-5 h-5" />
                <span className="hidden sm:block absolute top-1/2 -translate-y-1/2 right-full mr-2 bg-gray-900 text-white text-xs font-bold py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    投資商品を全フェーズこれに統一
                </span>
            </button>
        </div>
        
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InputField
                label="期間"
                value={block.durationYears}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onUpdate(block.id, { durationYears: isNaN(val) ? '' : val });
                }}
                suffix="年"
                step={1}
              />
              <InputField
                label="年次リターン"
                value={block.annualReturn}
                onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onUpdate(block.id, { annualReturn: isNaN(val) ? '' : val });
                }}
                suffix="%"
                step={0.5}
              />
              <InputField
                label="年次リスク"
                value={block.annualRisk}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdate(block.id, { annualRisk: isNaN(val) ? '' : val });
                }}
                suffix="%"
                step={0.5}
              />
              <InputField
                label="レバレッジ"
                value={block.leverage}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdate(block.id, { leverage: isNaN(val) ? '' : val });
                }}
                suffix="倍"
                placeholder="1"
                step={0.1}
              />
          </div>
          <div>
            <InputField
              label="毎月の積立/取崩額"
              value={block.monthlyContribution}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                onUpdate(block.id, { monthlyContribution: isNaN(val) ? '' : val });
              }}
              suffix="円"
              step={1000}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
            <input
                type="checkbox"
                id={`inflation-${block.id}`}
                checked={block.increaseWithInflation}
                onChange={(e) => onUpdate(block.id, { increaseWithInflation: e.target.checked })}
                className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500 focus:ring-offset-gray-800"
            />
            <label htmlFor={`inflation-${block.id}`} className="text-sm text-gray-300 select-none">
                毎月の積立/取崩額をインフレ率に合わせて増額する
            </label>
        </div>
      </div>
      <button onClick={() => onRemove(block.id)} className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded-full">
        <TrashIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default SimulationBlock;
