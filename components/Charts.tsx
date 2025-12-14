import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ReferenceLine, 
  Cell
} from 'recharts';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  AdjustmentsHorizontalIcon, 
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { AppView, ConstructionMethod } from '../types';

// --- Types & Constants ---
interface ComparatorProps {
    onNavigate: (view: AppView, moduleId?: string) => void;
}

type SuitabilityLevel = 'High' | 'Medium' | 'Low' | 'N/A';

interface MethodData {
    name: string;
    color: string;
    baseRate: number; // m/day
    mobTime: number; // days
    demobTime: number; // days
    baseCost: number; // per m
    depthLimit: number; // m
}

const METHODS: Record<string, MethodData> = {
    [ConstructionMethod.TBM]: { 
        name: 'TBM', 
        color: '#2563EB', 
        baseRate: 15, 
        mobTime: 90, 
        demobTime: 30, 
        baseCost: 25000, 
        depthLimit: 200 
    },
    [ConstructionMethod.NATM]: { 
        name: 'NATM', 
        color: '#0D9488', 
        baseRate: 4, 
        mobTime: 14, 
        demobTime: 7, 
        baseCost: 12000, 
        depthLimit: 100 
    },
    [ConstructionMethod.CutAndCover]: { 
        name: 'Cut & Cover', 
        color: '#F97316', 
        baseRate: 8, 
        mobTime: 30, 
        demobTime: 15, 
        baseCost: 8000, 
        depthLimit: 20 
    }
};

const GROUND_TYPES = ['Soft Clay', 'Mixed Ground', 'Hard Rock'] as const;

// --- Helper Components ---

const RiskIcon = ({ level }: { level: SuitabilityLevel }) => {
    switch(level) {
        case 'High': return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
        case 'Medium': return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />;
        case 'Low': return <XCircleIcon className="w-6 h-6 text-red-500" />;
        default: return <span className="text-slate-300">-</span>;
    }
};

interface NeuCardProps {
    children?: React.ReactNode;
    title: string;
    icon: React.ReactNode;
}

const NeuCard = ({ children, title, icon }: NeuCardProps) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
            <div className="text-slate-400 w-5 h-5">{icon}</div>
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{title}</h3>
        </div>
        <div className="flex-1 min-h-0">{children}</div>
    </div>
);

// --- Main Component ---

export const ComparisonCharts: React.FC<ComparatorProps> = ({ onNavigate }) => {
  // Scenario State
  const [length, setLength] = useState(1500); // meters
  const [ground, setGround] = useState<typeof GROUND_TYPES[number]>('Mixed Ground');
  
  // Targets (for visual reference lines)
  const targetRate = 10; 
  const budgetPerM = 15000;

  // Analysis Engine
  const analysis = useMemo(() => {
      return Object.values(METHODS).map(m => {
          // Adjust rate/cost based on ground
          let rateMod = 1;
          let costMod = 1;
          
          if(ground === 'Hard Rock') {
              if(m.name === 'TBM') { rateMod = 0.8; costMod = 1.2; } // Wear on cutters
              if(m.name === 'NATM') { rateMod = 0.6; costMod = 1.3; } // Drill & Blast slow
              if(m.name === 'Cut & Cover') { rateMod = 0.2; costMod = 2.0; } // Very hard to dig
          } else if (ground === 'Soft Clay') {
              if(m.name === 'NATM') { rateMod = 0.7; costMod = 1.1; } // Support heavy
          }

          const effectiveRate = m.baseRate * rateMod;
          const excavationTime = Math.ceil(length / effectiveRate);
          const totalTime = m.mobTime + excavationTime + m.demobTime;
          const totalCost = (m.baseCost * costMod) * length;

          // Suitability Logic
          let suitability: SuitabilityLevel = 'Medium';
          if (ground === 'Hard Rock') {
               if(m.name === 'TBM') suitability = 'High';
               if(m.name === 'Cut & Cover') suitability = 'Low';
          } else if (ground === 'Soft Clay') {
               if(m.name === 'TBM') suitability = 'High';
               if(m.name === 'NATM') suitability = 'Medium';
          } else {
               // Mixed
               if(m.name === 'TBM') suitability = 'Low'; // TBM hates mixed face
               if(m.name === 'NATM') suitability = 'High';
          }

          // Depth constraint logic (simplified for visualization)
          if(m.name === 'Cut & Cover' && length > 5000) suitability = 'Low'; // Not for long tunnels usually

          return {
              ...m,
              effectiveRate,
              excavationTime,
              totalTime,
              totalCost,
              costPerM: m.baseCost * costMod,
              suitability
          };
      });
  }, [length, ground]);

  return (
    <div className="h-full flex flex-col space-y-6">
      
      {/* 1. Scenario Input Tool */}
      <div className="bg-slate-800 text-white p-4 rounded-2xl shadow-lg flex flex-col md:flex-row items-center gap-6 z-10 sticky top-0">
          <div className="flex items-center gap-2 font-bold text-blue-300">
              <AdjustmentsHorizontalIcon className="w-5 h-5" /> Scenario Builder
          </div>
          
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                  <div className="flex justify-between text-xs font-bold uppercase mb-1 text-slate-400">
                      <span>Tunnel Length</span>
                      <span>{length} m</span>
                  </div>
                  <input 
                    type="range" min="100" max="5000" step="100" 
                    value={length} onChange={(e) => setLength(Number(e.target.value))}
                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
              </div>
              <div>
                   <div className="text-xs font-bold uppercase mb-1 text-slate-400">Ground Condition</div>
                   <div className="flex bg-slate-700 rounded-lg p-1">
                       {GROUND_TYPES.map(g => (
                           <button 
                            key={g} 
                            onClick={() => setGround(g)}
                            className={`flex-1 text-xs py-1 rounded-md font-bold transition-colors ${ground === g ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                           >
                               {g}
                           </button>
                       ))}
                   </div>
              </div>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        
        {/* 2. Top Row: Metrics & Risk */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[350px]">
            {/* Metric: Cost */}
            <NeuCard title="Unit Cost (€/m)" icon={<CurrencyDollarIcon />}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis} layout="vertical" margin={{top: 5, right: 30, left: 40, bottom: 5}}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} style={{fontSize: '10px', fontWeight: 'bold'}} />
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px'}} />
                        <ReferenceLine x={budgetPerM} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'top', value: 'Budget', fontSize: 10, fill: '#64748b' }} />
                        <Bar dataKey="costPerM" radius={[0, 4, 4, 0]} barSize={20}>
                            {analysis.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </NeuCard>

            {/* Metric: Speed */}
            <NeuCard title="Advance Rate (m/day)" icon={<ClockIcon />}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis} layout="vertical" margin={{top: 5, right: 30, left: 40, bottom: 5}}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} style={{fontSize: '10px', fontWeight: 'bold'}} />
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px'}} />
                        <ReferenceLine x={targetRate} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'top', value: 'Target', fontSize: 10, fill: '#64748b' }} />
                        <Bar dataKey="effectiveRate" radius={[0, 4, 4, 0]} barSize={20}>
                             {analysis.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </NeuCard>

            {/* Risk Matrix */}
            <NeuCard title="Geological Suitability" icon={<ExclamationTriangleIcon />}>
                <div className="h-full flex flex-col justify-center overflow-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase border-b border-slate-100">
                            <tr>
                                <th className="py-2">Method</th>
                                <th className="py-2 text-center">Fit</th>
                                <th className="py-2">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {analysis.map(m => (
                                <tr key={m.name}>
                                    <td className="py-3 font-bold" style={{color: m.color}}>{m.name}</td>
                                    <td className="py-3 text-center"><RiskIcon level={m.suitability} /></td>
                                    <td className="py-3 text-xs text-slate-500">
                                        {m.suitability === 'High' ? 'Optimal choice' : m.suitability === 'Medium' ? 'Feasible with measures' : 'High risk / Not recommended'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </NeuCard>
        </div>

        {/* 3. Gantt Chart View */}
        <div className="h-[300px]">
             <NeuCard title="Project Timeline Estimation" icon={<ClockIcon />}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis} layout="vertical" barSize={30} margin={{top: 20, right: 30, left: 40, bottom: 5}}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} />
                        <XAxis type="number" label={{ value: 'Days', position: 'insideBottom', offset: -5 }} />
                        <YAxis dataKey="name" type="category" width={80} style={{fontWeight: 'bold', fontSize: '12px'}} />
                        <Tooltip />
                        <Legend wrapperStyle={{paddingTop: '10px'}} />
                        <Bar dataKey="mobTime" name="Mobilization" stackId="a" fill="#cbd5e1" />
                        <Bar dataKey="excavationTime" name="Excavation" stackId="a">
                            {analysis.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                        <Bar dataKey="demobTime" name="Demob." stackId="a" fill="#64748b" />
                    </BarChart>
                </ResponsiveContainer>
             </NeuCard>
        </div>

        {/* 4. Educational Detail Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl relative group hover:shadow-md transition-all">
                <h4 className="font-bold text-blue-800 mb-2">TBM Method</h4>
                <ul className="text-sm text-blue-900/70 space-y-1 mb-4 list-disc pl-4">
                    <li>High advance rates in uniform ground</li>
                    <li>Low disturbance to surface</li>
                    <li>High initial capital cost</li>
                </ul>
                <button 
                    onClick={() => onNavigate(AppView.Learn, 'mod2')}
                    className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                    Learn Module 2 <ArrowRightIcon className="w-3 h-3" />
                </button>
            </div>

            <div className="bg-teal-50 border border-teal-100 p-6 rounded-2xl relative group hover:shadow-md transition-all">
                <h4 className="font-bold text-teal-800 mb-2">NATM / SCL</h4>
                <ul className="text-sm text-teal-900/70 space-y-1 mb-4 list-disc pl-4">
                    <li>Flexible for variable geology</li>
                    <li>Lower mobilization time</li>
                    <li>Requires sequential excavation</li>
                </ul>
                <button 
                    onClick={() => onNavigate(AppView.Learn, 'mod3')}
                    className="flex items-center gap-2 text-xs font-bold text-teal-600 hover:text-teal-800"
                >
                    Learn Module 3 <ArrowRightIcon className="w-3 h-3" />
                </button>
            </div>

            <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl relative group hover:shadow-md transition-all">
                <h4 className="font-bold text-orange-800 mb-2">Cut & Cover</h4>
                <ul className="text-sm text-orange-900/70 space-y-1 mb-4 list-disc pl-4">
                    <li>Cheapest for shallow depths</li>
                    <li>High surface disruption</li>
                    <li>Limited by depth (&lt;30m)</li>
                </ul>
                <button 
                     onClick={() => onNavigate(AppView.Learn, 'mod1')} 
                    className="flex items-center gap-2 text-xs font-bold text-orange-600 hover:text-orange-800"
                >
                    Learn Basics <ArrowRightIcon className="w-3 h-3" />
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};