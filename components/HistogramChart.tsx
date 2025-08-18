import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';

interface HistogramChartProps {
  data: number[];
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

interface Bin {
    range: string;
    value: number; // start of bin
    endValue: number; // end of bin
    count: number;
}

const createHistogramData = (data: number[], numBins: number = 20): Bin[] => {
    if (!data || data.length === 0) return [];

    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    
    if (minVal === maxVal) {
        return [{ range: formatCurrency(minVal), value: minVal, endValue: maxVal, count: data.length }];
    }

    const binWidth = (maxVal - minVal) / numBins;
    
    if (binWidth <= 0) {
       return [{ range: formatCurrency(minVal), value: minVal, endValue: maxVal, count: data.length }];
    }

    const bins: Bin[] = Array.from({ length: numBins }, (_, i) => {
        const binStart = minVal + i * binWidth;
        const binEnd = binStart + binWidth;
        return {
            range: formatCurrency(binStart),
            value: binStart,
            endValue: binEnd,
            count: 0,
        };
    });

    for (const d of data) {
        const binIndex = Math.floor((d - minVal) / binWidth);
        const targetIndex = Math.min(binIndex, numBins - 1);
        if (bins[targetIndex]) {
            bins[targetIndex].count++;
        }
    }

    return bins;
};

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as Bin;
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm p-3 border border-gray-600 rounded-lg shadow-lg">
        <p className="label text-gray-200 font-bold">{`資産額: ${data.range} ~ ${formatCurrency(data.endValue)}`}</p>
        <p className="text-sm text-cyan-300">{`度数: ${data.count}`}</p>
      </div>
    );
  }
  return null;
};


const HistogramChart: React.FC<HistogramChartProps> = ({ data, isLoading }) => {
    const [maxPercentile, setMaxPercentile] = useState<number>(100);

    // Reset slider when main data changes
    useEffect(() => {
        setMaxPercentile(100);
    }, [data]);

    const sortedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return [...data].sort((a, b) => a - b);
    }, [data]);

    const { maxAsset, filteredData } = useMemo(() => {
        if (sortedData.length === 0) return { maxAsset: 0, filteredData: [] };

        const minAssetValue = sortedData[0];
        
        let maxAssetValue;
        if (maxPercentile >= 100) {
            maxAssetValue = sortedData[sortedData.length - 1];
        } else {
            const maxIndex = Math.floor(sortedData.length * (maxPercentile / 100));
            maxAssetValue = sortedData[Math.min(maxIndex, sortedData.length - 1)];
        }
        
        const effectiveMaxAsset = Math.max(maxAssetValue, minAssetValue);
        const filtered = data.filter(d => d <= effectiveMaxAsset);
        
        return { maxAsset: effectiveMaxAsset, filteredData: filtered };

    }, [data, sortedData, maxPercentile]);

    const histogramData = useMemo(() => createHistogramData(filteredData), [filteredData]);
    
    if (isLoading) {
        return (
          <div className="bg-gray-800 rounded-xl h-[400px] lg:flex-1 lg:h-auto">
            {/* Loading state is silent here as the main chart shows it */}
          </div>
        );
    }
    
    if (!data || data.length === 0) {
        return (
          <div className="bg-gray-800 rounded-xl h-[400px] lg:flex-1 lg:h-auto">
             {/* No data state is silent here */}
          </div>
        );
    }

    const isZoomed = maxPercentile < 100;

    return (
        <div className="relative bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg h-[400px] flex flex-col lg:flex-1 lg:h-auto">
            <div className="flex justify-center items-center mb-2 relative h-7">
                <h3 className="text-lg font-bold text-white text-center">
                    最終資産の分布
                </h3>
                {isZoomed && (
                    <button 
                        onClick={() => setMaxPercentile(100)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-1 px-3 rounded-lg text-xs transition-colors"
                    >
                        リセット
                    </button>
                )}
            </div>
            <div className="flex-grow min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={histogramData} margin={{ top: 5, right: 30, left: 30, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                        <XAxis 
                            dataKey="range" 
                            stroke="#9ca3af"
                            tick={{ fill: '#d1d5db', fontSize: 12 }}
                            tickLine={{ stroke: '#9ca3af' }}
                            interval="preserveStartEnd"
                        >
                           <Label value="最終資産額" position="insideBottom" offset={-15} fill="#9ca3af" />
                        </XAxis>
                        <YAxis 
                            stroke="#9ca3af" 
                            tick={{ fill: '#d1d5db' }}
                            tickLine={{ stroke: '#9ca3af' }}
                            allowDecimals={false}
                        >
                            <Label value="度数" angle={-90} position="insideLeft" offset={-10} fill="#9ca3af" />
                        </YAxis>
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(34, 211, 238, 0.1)'}} />
                        <Bar dataKey="count" name="度数" fill="#22d3ee" barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="pt-4 px-8 pb-2">
                <label htmlFor="percentile-slider" className="block text-sm font-medium text-gray-300 mb-2 text-center">
                    表示範囲 (上位 {100 - maxPercentile}% を除外): ~{formatCurrency(maxAsset)}
                </label>
                <input
                    id="percentile-slider"
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={maxPercentile}
                    onChange={(e) => setMaxPercentile(Number(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg accent-cyan-500"
                />
            </div>
        </div>
    );
};

export default HistogramChart;