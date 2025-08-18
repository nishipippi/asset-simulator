import React from 'react';
import { SimulationResult } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SimulationChartProps {
  data: SimulationResult;
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (absValue >= 1_000_000_000_000) return `${sign}¥${(absValue / 1_000_000_000_000).toFixed(1)}兆`;
    if (absValue >= 100_000_000) return `${sign}¥${(absValue / 100_000_000).toFixed(1)}億`;
    if (absValue >= 1_0000) return `${sign}¥${(absValue / 1_0000).toFixed(1)}万`;
    return `¥${value.toFixed(0)}`;
};

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm p-3 border border-gray-600 rounded-lg shadow-lg">
        <p className="label text-gray-200 font-bold">{`経過年数: ${label}年`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
            {`${entry.name}: ${formatCurrency(entry.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const SimulationChart: React.FC<SimulationChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center bg-gray-800 rounded-xl h-[400px] lg:flex-1 lg:h-auto">
        <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-cyan-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-lg font-semibold text-gray-300">シミュレーションを実行中...</p>
            <p className="text-sm text-gray-400">しばらくお待ちください。</p>
        </div>
      </div>
    );
  }
  
  if (!data || data.length <= 1) {
    return (
      <div className="flex items-center justify-center bg-gray-800 rounded-xl h-[400px] lg:flex-1 lg:h-auto">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-300">表示するデータがありません</h3>
          <p className="text-gray-400 mt-1">プランを設定してシミュレーションを実行してください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg h-[400px] flex flex-col lg:flex-1 lg:h-auto">
       <h3 className="text-lg font-bold text-white mb-4 text-center">資産推移</h3>
      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 30, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
            <XAxis 
              dataKey="year" 
              stroke="#9ca3af" 
              tick={{ fill: '#d1d5db' }}
              tickLine={{ stroke: '#9ca3af' }}
              label={{ value: "年", position: 'insideBottomRight', offset: -15, fill: '#9ca3af' }}
              />
            <YAxis 
              stroke="#9ca3af" 
              tickFormatter={formatCurrency}
              tick={{ fill: '#d1d5db' }}
              tickLine={{ stroke: '#9ca3af' }}
              label={{ value: "資産額", angle: -90, position: 'insideLeft', offset: -10, fill: '#9ca3af' }}
              />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#d1d5db' }} />
            <Line type="monotone" dataKey="p25" name="25パーセンタイル" stroke="#facc15" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="median" name="中央値" stroke="#22d3ee" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="p75" name="75パーセンタイル" stroke="#4ade80" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SimulationChart;