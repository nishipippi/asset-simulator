
import React from 'react';
import { SpotPayment } from '../types';
import TrashIcon from './icons/TrashIcon';

interface SpotPaymentItemProps {
  payment: SpotPayment;
  onUpdate: (id: string, newPaymentData: Partial<SpotPayment>) => void;
  onRemove: (id: string) => void;
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

const SpotPaymentItem: React.FC<SpotPaymentItemProps> = ({ payment, onUpdate, onRemove }) => {
  const isExpense = Number(payment.amount) < 0;

  return (
    <div className={`bg-gray-800 border-l-4 ${isExpense ? 'border-red-500' : 'border-green-500'} rounded-r-lg p-3 shadow-md flex items-center gap-4`}>
      <div className="flex-1 space-y-3">
        <input
            type="text"
            value={payment.name}
            onChange={(e) => onUpdate(payment.id, { name: e.target.value })}
            placeholder="イベント名 (例: 車の購入)"
            className="w-full bg-transparent text-md font-bold text-white placeholder-gray-500 focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-3">
            <InputField
              label="発生年"
              value={payment.year}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                onUpdate(payment.id, { year: isNaN(val) ? '' : val });
              }}
              suffix="年後"
            />
            <InputField
              label="金額"
              value={payment.amount}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                onUpdate(payment.id, { amount: isNaN(val) ? '' : val });
              }}
              suffix="円"
            />
        </div>
      </div>
      <button onClick={() => onRemove(payment.id)} className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded-full self-start">
        <TrashIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default SpotPaymentItem;
