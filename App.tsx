import React, { useState, useEffect, useMemo } from 'react';
import { ThreeView } from './components/ThreeView';
import { ComparisonCharts } from './components/Charts';
import { askTunnelTutor } from './services/geminiService';
import { TunnelShape, GeoMaterial, GeologicalLayer, TunnelDesign, AppView } from './types';
import { 
  CubeIcon, 
  Square3Stack3DIcon, 
  ChartBarIcon, 
  AcademicCapIcon, 
  ChatBubbleLeftRightIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

// Default Data
const DEFAULT_DESIGN: TunnelDesign = {
  shape: TunnelShape.Circular,
  width: 6,
  height: 6,
  wallThickness: 0.3,
  depth: 20
};

const DEFAULT_LAYERS: GeologicalLayer[] = [
  { id: '1', type: GeoMaterial.SoftClay, thickness: 10, color: '#8B4513', density: 18 },
  { id: '2', type: GeoMaterial.Sand, thickness: 15, color: '#F4A460', density: 20 },
  { id: '3', type: GeoMaterial.SoundRock, thickness: 30, color: '#708090', density: 25 },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.Designer);
  const [design, setDesign] = useState<TunnelDesign>(DEFAULT_DESIGN);
  const [layers, setLayers] = useState<GeologicalLayer[]>(DEFAULT_LAYERS);
  
  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Calculations
  const calculations = useMemo(() => {
    const radius = design.width / 2;
    let area = 0;
    let perimeter = 0;
    
    if (design.shape === TunnelShape.Circular) {
      area = Math.PI * Math.pow(radius, 2);
      perimeter = 2 * Math.PI * radius;
    } else if (design.shape === TunnelShape.Rectangular) {
      area = design.width * design.height;
      perimeter = 2 * (design.width + design.height);
    } else {
      // Approximate Horseshoe
      area = (Math.PI * Math.pow(radius, 2) / 2) + (design.width * design.height * 0.5); 
      perimeter = (Math.PI * radius) + (design.height * 2) + design.width;
    }

    const excavationVol = area * 100; // per 100m
    
    // Overburden
    let pressure = 0;
    let depthCount = 0;
    for (const layer of layers) {
      if (depthCount + layer.thickness > design.depth) {
        // Partial layer
        const remaining = design.depth - depthCount;
        pressure += remaining * layer.density;
        break;
      } else {
        pressure += layer.thickness * layer.density;
        depthCount += layer.thickness;
      }
    }

    return { area, perimeter, excavationVol, pressure };
  }, [design, layers]);

  const handleAiAsk = async () => {
    if (!chatQuery.trim()) return;
    setIsTyping(true);
    setChatResponse(null);
    
    const context = `Current Design: ${design.shape} tunnel, Width ${design.width}m. 
    Geology includes: ${layers.map(l => l.type).join(', ')}. 
    Calculated Overburden Pressure: ${calculations.pressure.toFixed(1)} kPa.`;

    const response = await askTunnelTutor(chatQuery, context);
    setChatResponse(response);
    setIsTyping(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20 transition-all">
        <div className="p-6 flex items-center justify-center lg:justify-start border-b border-slate-700">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-0 lg:mr-3">
            <span className="font-bold text-white text-lg">T</span>
          </div>
          <h1 className="hidden lg:block text-xl font-bold tracking-tight">TunnelViz</h1>
        </div>
        
        <nav className="flex-1 py-6 space-y-2 px-3">
          <NavButton 
            active={currentView === AppView.Designer} 
            onClick={() => setCurrentView(AppView.Designer)} 
            icon={<CubeIcon className="w-6 h-6" />} 
            label="Designer" 
          />
          <NavButton 
            active={currentView === AppView.Simulator} 
            onClick={() => setCurrentView(AppView.Simulator)} 
            icon={<Square3Stack3DIcon className="w-6 h-6" />} 
            label="Geology" 
          />
          <NavButton 
            active={currentView === AppView.Comparator} 
            onClick={() => setCurrentView(AppView.Comparator)} 
            icon={<ChartBarIcon className="w-6 h-6" />} 
            label="Compare" 
          />
          <NavButton 
            active={currentView === AppView.Learn} 
            onClick={() => setCurrentView(AppView.Learn)} 
            icon={<AcademicCapIcon className="w-6 h-6" />} 
            label="Learn" 
          />
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="hidden lg:block text-xs text-slate-400 mb-2">User: Student</div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="w-3/4 h-full bg-green-500" />
          </div>
          <div className="hidden lg:block text-xs text-slate-400 mt-1 text-right">XP: 750</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-800">{currentView} Workspace</h2>
          <button 
            onClick={() => setChatOpen(!chatOpen)}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full hover:bg-indigo-100 transition-colors"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            <span className="font-medium">AI Tutor</span>
          </button>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-auto p-6 scroll-smooth">
          
          {/* DESIGNER VIEW */}
          {currentView === AppView.Designer && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              {/* Controls */}
              <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-y-auto">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Parameters</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tunnel Shape</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.values(TunnelShape).map(s => (
                        <button
                          key={s}
                          onClick={() => setDesign({...design, shape: s})}
                          className={`p-2 text-xs rounded-lg border transition-all ${
                            design.shape === s 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <ControlSlider 
                    label={design.shape === TunnelShape.Circular ? "Diameter (m)" : "Width (m)"}
                    value={design.width}
                    min={3} max={15} step={0.5}
                    onChange={(v) => setDesign({...design, width: v})}
                  />

                  {design.shape !== TunnelShape.Circular && (
                    <ControlSlider 
                      label="Height (m)"
                      value={design.height}
                      min={3} max={15} step={0.5}
                      onChange={(v) => setDesign({...design, height: v})}
                    />
                  )}

                  <ControlSlider 
                    label="Lining Thickness (m)"
                    value={design.wallThickness}
                    min={0.2} max={1.0} step={0.1}
                    onChange={(v) => setDesign({...design, wallThickness: v})}
                  />
                  
                  <ControlSlider 
                    label="Depth Below Surface (m)"
                    value={design.depth}
                    min={5} max={100} step={1}
                    onChange={(v) => setDesign({...design, depth: v})}
                  />
                </div>
              </div>

              {/* 3D Visualizer */}
              <div className="lg:col-span-6 h-[500px] lg:h-auto rounded-2xl overflow-hidden shadow-lg border border-slate-800">
                <ThreeView design={design} layers={layers} />
              </div>

              {/* Real-time Stats */}
              <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Analysis</h3>
                
                <div className="space-y-4">
                  <StatCard label="Excavation Area" value={calculations.area.toFixed(2)} unit="m²" />
                  <StatCard label="Perimeter" value={calculations.perimeter.toFixed(2)} unit="m" />
                  <StatCard label="Spoil Volume (100m)" value={calculations.excavationVol.toFixed(0)} unit="m³" />
                  
                  <div className="h-px bg-slate-100 my-4" />
                  
                  <StatCard 
                    label="Overburden Pressure" 
                    value={calculations.pressure.toFixed(1)} 
                    unit="kPa"
                    highlight 
                  />
                  
                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-sm text-yellow-800">
                    <strong>Design Tip:</strong> {design.width > 12 ? 'Large diameter requires heavier support.' : 'Standard dimensions within efficient range.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SIMULATOR VIEW (Geology) */}
          {currentView === AppView.Simulator && (
            <div className="flex flex-col lg:flex-row gap-6 h-full">
               <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-y-auto">
                 <h3 className="text-xl font-bold mb-4">Geological Stratification</h3>
                 <p className="text-slate-500 mb-6">Drag to reorder layers or adjust properties to simulate ground conditions.</p>
                 
                 <div className="space-y-4">
                    {layers.map((layer, idx) => (
                      <div key={layer.id} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg group hover:border-blue-300 transition-colors">
                         <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: layer.color }}>
                            {idx + 1}
                         </div>
                         <div className="flex-1">
                           <select 
                            className="block w-full bg-transparent font-semibold text-slate-800 border-none p-0 focus:ring-0"
                            value={layer.type}
                            onChange={(e) => {
                               const newLayers = [...layers];
                               newLayers[idx] = { ...layer, type: e.target.value as GeoMaterial };
                               setLayers(newLayers);
                            }}
                           >
                              {Object.values(GeoMaterial).map(m => <option key={m} value={m}>{m}</option>)}
                           </select>
                           <div className="text-xs text-slate-500 mt-1">Density: {layer.density} kN/m³</div>
                         </div>
                         <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              className="w-16 p-1 border border-slate-300 rounded text-right"
                              value={layer.thickness}
                              onChange={(e) => {
                                const newLayers = [...layers];
                                newLayers[idx].thickness = Number(e.target.value);
                                setLayers(newLayers);
                              }}
                            />
                            <span className="text-sm text-slate-400">m</span>
                         </div>
                      </div>
                    ))}
                 </div>
               </div>
               <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 bg-white">
                  <div className="h-full p-8 flex flex-col justify-center items-center bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]">
                      <h4 className="text-slate-400 font-mono mb-4">Visual Profile</h4>
                      <div className="w-64 border-l-2 border-slate-800 relative">
                         {layers.map((layer) => (
                           <div 
                            key={layer.id}
                            className="w-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                            style={{ 
                              height: `${layer.thickness * 10}px`, 
                              backgroundColor: layer.color,
                              opacity: 0.9
                            }}
                           >
                              {layer.type} ({layer.thickness}m)
                           </div>
                         ))}
                         {/* Tunnel Marker */}
                         <div 
                          className="absolute w-full border-t-2 border-dashed border-red-500 flex items-center"
                          style={{ top: `${design.depth * 10}px` }}
                         >
                            <span className="bg-red-500 text-white text-[10px] px-1 rounded-r absolute -right-20">Tunnel Axis (-{design.depth}m)</span>
                         </div>
                      </div>
                  </div>
               </div>
            </div>
          )}

          {/* COMPARATOR VIEW */}
          {currentView === AppView.Comparator && (
             <div className="h-full flex flex-col gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Method Comparison</h2>
                  <p className="text-slate-500">Comparing excavation methods based on current geology and tunnel dimensions.</p>
                </div>
                <div className="flex-1">
                  <ComparisonCharts />
                </div>
                <div className="grid grid-cols-3 gap-6">
                    {['TBM', 'NATM', 'Cut & Cover'].map((method) => (
                      <div key={method} className="bg-white p-6 rounded-xl border border-slate-200 hover:border-blue-400 transition-all cursor-pointer group">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-lg">{method}</h4>
                          <BeakerIcon className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {method === 'TBM' && "Ideal for long tunnels in competent rock or soft ground. High startup cost."}
                          {method === 'NATM' && "Flexible method using sequential excavation and shotcrete. Good for variable ground."}
                          {method === 'Cut & Cover' && "Best for shallow urban tunnels. Disruptive to surface traffic."}
                        </p>
                      </div>
                    ))}
                </div>
             </div>
          )}

          {/* LEARN VIEW */}
          {currentView === AppView.Learn && (
            <div className="max-w-4xl mx-auto bg-white min-h-full p-12 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-blue-600 font-bold tracking-wider text-xs uppercase mb-2 block">Module 1.1</span>
              <h1 className="text-4xl font-extrabold text-slate-900 mb-6">The Fundamentals of Tunnel Geometry</h1>
              
              <div className="prose prose-slate max-w-none">
                <p className="lead text-xl text-slate-600 mb-8">
                  Why are most tunnels circular? It's not just for aesthetics—it's about how forces flow through the structure.
                </p>
                
                <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-4">The Arch Effect</h3>
                <p>
                  In a circular tunnel, the ground pressure is distributed evenly around the ring, putting the lining primarily into 
                  <strong>compression</strong>. Concrete is excellent at handling compression but weak in tension. This makes the circle 
                  the most structural efficient shape for deep tunnels.
                </p>

                <div className="my-8 bg-blue-50 p-6 rounded-xl border-l-4 border-blue-500">
                  <h4 className="font-bold text-blue-900 mb-2">Interactive Check</h4>
                  <p className="text-blue-800 mb-4">Go to the Designer and select "Rectangular". Notice how the corners are sharp? 
                  These are stress concentration points where cracks form easily.</p>
                  <button 
                    onClick={() => setCurrentView(AppView.Designer)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
                  >
                    Try it now
                  </button>
                </div>

                <h3 className="text-2xl font-bold text-slate-800 mt-8 mb-4">Horseshoe Profiles</h3>
                <p>
                  Often used in mining or road tunnels constructed via NATM, the horseshoe shape provides a flat floor for vehicles 
                  while maintaining an arched roof to support the rock load overhead.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* AI Tutor Chat Overlay */}
        {chatOpen && (
          <div className="absolute bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
             <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <h3 className="font-bold">Professor TunnelViz</h3>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-indigo-200 hover:text-white">✕</button>
             </div>
             
             <div className="h-80 p-4 overflow-y-auto bg-slate-50 space-y-4">
                <div className="flex gap-3">
                   <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">AI</div>
                   <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-700 border border-slate-100">
                     Hello! I'm here to help you understand your design or general tunnel concepts. Ask me anything!
                   </div>
                </div>
                
                {chatResponse && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">AI</div>
                    <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-700 border border-slate-100">
                      {chatResponse}
                    </div>
                  </div>
                )}
                
                {isTyping && <div className="text-xs text-slate-400 ml-12">Professor is thinking...</div>}
             </div>

             <div className="p-4 bg-white border-t border-slate-200">
                <div className="flex gap-2">
                   <input 
                    type="text" 
                    value={chatQuery}
                    onChange={(e) => setChatQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()}
                    placeholder="Ask about your tunnel..."
                    className="flex-1 bg-slate-100 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                   />
                   <button 
                    onClick={handleAiAsk}
                    className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                      </svg>
                   </button>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Sub-components for Cleaner App.tsx

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    {icon}
    <span className="font-medium hidden lg:block">{label}</span>
  </button>
);

const ControlSlider = ({ label, value, min, max, step, onChange }: { label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void }) => (
  <div>
    <div className="flex justify-between mb-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <span className="text-sm font-mono text-slate-500">{value}</span>
    </div>
    <input 
      type="range" 
      min={min} max={max} step={step} 
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
    />
  </div>
);

const StatCard = ({ label, value, unit, highlight = false }: { label: string, value: string, unit: string, highlight?: boolean }) => (
  <div className={`flex justify-between items-center p-3 rounded-lg ${highlight ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50'}`}>
    <span className={`text-sm ${highlight ? 'text-indigo-700 font-semibold' : 'text-slate-600'}`}>{label}</span>
    <div className="text-right">
      <span className={`text-lg font-mono font-bold ${highlight ? 'text-indigo-900' : 'text-slate-900'}`}>{value}</span>
      <span className="text-xs text-slate-400 ml-1">{unit}</span>
    </div>
  </div>
);

export default App;