import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface ComparisonData {
  name: string;
  cost: number;
  speed: number;
  safety: number;
}

const data: ComparisonData[] = [
  { name: 'TBM', cost: 25000, speed: 15, safety: 90 },
  { name: 'NATM', cost: 12000, speed: 4, safety: 70 },
  { name: 'Cut & Cover', cost: 8000, speed: 8, safety: 85 },
];

export const ComparisonCharts: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Cost Estimate (€/m)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => [`€${value.toLocaleString()}`, 'Cost']}
              contentStyle={{ borderRadius: '8px' }}
            />
            <Bar dataKey="cost" fill="#2563EB" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Advance Rate (m/day)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => [`${value} m/day`, 'Speed']}
              contentStyle={{ borderRadius: '8px' }}
            />
            <Bar dataKey="speed" fill="#0D9488" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
