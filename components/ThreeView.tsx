import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html, Line, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { TunnelDesign, GeologicalLayer, TunnelShape, ConstructionMethod, SimulationSettings, GeoMaterial } from '../types';
import { EyeIcon, EyeSlashIcon, ViewfinderCircleIcon, BeakerIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface ThreeViewProps {
  design: TunnelDesign;
  layers: GeologicalLayer[];
  slice: number;
  simulation: SimulationSettings;
  highlightedLayerId?: string | null;
}

// --- Procedural Texture Generation (Geological Patterns) ---
const generateGeoTexture = (type: GeoMaterial, colorStr: string): THREE.CanvasTexture => {
    const size = 512; // Higher resolution for better detail
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Background
    ctx.fillStyle = colorStr;
    ctx.fillRect(0, 0, size, size);

    // Base Noise / Texture
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    for(let i=0; i<2000; i++) {
        ctx.fillRect(Math.random()*size, Math.random()*size, 2, 2);
    }

    // Pattern Style
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 2;

    switch(type) {
        case GeoMaterial.Sand:
            // Stipple / Dots
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            for(let i=0; i<1500; i++) {
                ctx.beginPath();
                const x = Math.random() * size;
                const y = Math.random() * size;
                ctx.arc(x, y, 1.5, 0, Math.PI*2);
                ctx.fill();
            }
            break;
        case GeoMaterial.SoftClay:
        case GeoMaterial.StiffClay:
            // Bedding Planes (Horizontal lines)
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            for(let y=0; y<size; y+=40) {
                 // Wobbly lines
                 ctx.beginPath();
                 ctx.moveTo(0, y);
                 for(let x=0; x<=size; x+=20) {
                     ctx.lineTo(x, y + Math.sin(x*0.05)*5);
                 }
                 ctx.stroke();
            }
            break;
        case GeoMaterial.Gravel:
            // Circles/Stones
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            for(let i=0; i<200; i++) {
                ctx.beginPath();
                const r = 4 + Math.random() * 8;
                ctx.arc(Math.random()*size, Math.random()*size, r, 0, Math.PI*2);
                ctx.stroke();
            }
            break;
        case GeoMaterial.WeatheredRock:
            // Fractured pattern
            ctx.lineWidth = 2;
            ctx.beginPath();
            for(let i=0; i<50; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                ctx.moveTo(x, y);
                ctx.lineTo(x + (Math.random()-0.5)*100, y + (Math.random()-0.5)*100);
            }
            ctx.stroke();
            break;
        case GeoMaterial.SoundRock:
        case GeoMaterial.Granite:
            // Cross hatching / Blocky
            ctx.lineWidth = 3;
            const space = 60;
            ctx.beginPath();
            for(let i=-size; i<size*2; i+=space) {
                 ctx.moveTo(i, 0); ctx.lineTo(i+size, size); // Diagonal 1
            }
            if (type === GeoMaterial.Granite) {
                 // Granite has orthogonal joints often, or speckles. Let's add speckles on top.
                 ctx.fillStyle = 'rgba(255,255,255,0.15)';
                 for(let i=0; i<500; i++) {
                     ctx.fillRect(Math.random()*size, Math.random()*size, 4, 4);
                 }
            } else {
                 // Sound Rock - second diagonal
                 for(let i=-size; i<size*2; i+=space) {
                     ctx.moveTo(i, size); ctx.lineTo(i+size, 0); 
                 }
            }
            ctx.stroke();
            break;
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    // Anisotropy for sharper angles
    tex.anisotropy = 4;
    return tex;
};

// --- Inspector Tooltip Component ---
const Inspector: React.FC<{ data: any | null, clear: () => void }> = ({ data, clear }) => {
  if (!data || !data.props) return null;
  return (
    <Html position={data.point}>
      <div className="bg-slate-900/90 text-white p-3 rounded-lg text-xs w-48 backdrop-blur-md border border-slate-600 shadow-xl pointer-events-none select-none z-50 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-2 border-b border-slate-600 pb-1 pointer-events-auto">
          <span className="font-bold text-blue-300">{data.title}</span>
          <button onClick={(e) => { e.stopPropagation(); clear(); }} className="text-slate-400 hover:text-white px-1">×</button>
        </div>
        <div className="space-y-1">
          {Object.entries(data.props).map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-slate-400 capitalize">{k}:</span>
              <span>{v as string}</span>
            </div>
          ))}
        </div>
      </div>
    </Html>
  );
};

// --- Borehole Log Panel (Overlay) ---
const BoreholeLog: React.FC<{ layers: GeologicalLayer[], depth: number }> = ({ layers, depth }) => {
    return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-xl border border-slate-300 w-48 text-xs font-mono select-none">
            <div className="font-bold text-slate-800 border-b border-slate-300 pb-2 mb-2 flex justify-between">
                <span>BH-01</span>
                <span className="text-slate-500">Log</span>
            </div>
            
            <div className="flex text-[10px] text-slate-500 mb-1 border-b border-slate-200 pb-1">
                <div className="w-8">Dpth</div>
                <div className="w-16">Lithology</div>
                <div className="flex-1 text-right">N/RQD</div>
            </div>

            <div className="space-y-1 relative">
                {/* Scale Lines */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200"></div>

                {layers.map((layer, i) => {
                    // Approximate depth accumulation for visualization
                    let depthAcc = 0;
                    for(let j=0; j<i; j++) depthAcc += layers[j].thickness;
                    
                    return (
                        <div key={layer.id} className="relative py-2 border-b border-slate-100 last:border-0 group">
                            <div className="flex items-start">
                                <div className="w-8 text-slate-400">-{depthAcc}m</div>
                                <div className="w-16 font-bold text-slate-700 truncate" title={layer.type}>{layer.type}</div>
                                <div className="flex-1 text-right flex flex-col items-end">
                                    {layer.spt_n && <span className="text-blue-600 font-bold">N={layer.spt_n}</span>}
                                    {layer.rqd && <span className="text-emerald-600 font-bold">RQD:{layer.rqd}%</span>}
                                    {!layer.spt_n && !layer.rqd && <span className="text-slate-300">-</span>}
                                </div>
                            </div>
                            {/* Graphic Pattern Strip */}
                            <div className="h-1 w-full mt-1 opacity-50" style={{ backgroundColor: layer.color }}></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Advanced Metrics Panel (Calculations) ---
const AdvancedMetricsPanel: React.FC<{ layers: GeologicalLayer[], design: TunnelDesign, waterLevel: number }> = ({ layers, design, waterLevel }) => {
    // 1. Determine active layer at tunnel depth
    let currentDepth = 0;
    let activeLayer: GeologicalLayer | null = null;
    for(const l of layers) {
        if(currentDepth + l.thickness >= design.depth) {
            activeLayer = l;
            break;
        }
        currentDepth += l.thickness;
    }

    if (!activeLayer) return null;

    // 2. Calculations
    const overburden = design.depth * activeLayer.density; // kPa
    const supportPressure = (overburden * 0.4).toFixed(0); // Simplified K0 assumption
    
    // Stand-up Time Logic
    let standUpTime = "N/A";
    let thiScore = 0; // Tunnel Hazard Index

    if (activeLayer.type === GeoMaterial.SoundRock || activeLayer.type === GeoMaterial.Granite) {
        standUpTime = "> 1 Year";
        thiScore += 1;
    } else if (activeLayer.type === GeoMaterial.StiffClay || activeLayer.type === GeoMaterial.WeatheredRock) {
        standUpTime = "10-24 Hours";
        thiScore += 4;
    } else {
        standUpTime = "< 30 Mins";
        thiScore += 8;
    }

    // Water penalty
    const isUnderWater = waterLevel > 0;
    if (isUnderWater) thiScore += activeLayer.permeability === 'High' ? 2 : 1;

    // THI Color
    const thiColor = thiScore > 7 ? 'text-red-500' : thiScore > 3 ? 'text-yellow-600' : 'text-green-500';

    return (
        <div className="bg-slate-900/90 backdrop-blur-md p-3 rounded-lg border border-slate-700 w-48 text-xs text-slate-300 space-y-3 shadow-xl">
             <div className="border-b border-slate-700 pb-1 font-bold text-white flex gap-2">
                <BeakerIcon className="w-4 h-4 text-purple-400" /> Engineer's Log
             </div>
             <div>
                <span className="block text-[10px] uppercase tracking-wider text-slate-500">Est. Stand-up Time</span>
                <span className="font-mono text-white text-sm">{standUpTime}</span>
             </div>
             <div>
                <span className="block text-[10px] uppercase tracking-wider text-slate-500">Support Pressure (Pi)</span>
                <span className="font-mono text-white text-sm">{supportPressure} kPa</span>
             </div>
             <div>
                <span className="block text-[10px] uppercase tracking-wider text-slate-500">Tunnel Hazard Index</span>
                <div className="flex items-end gap-1">
                    <span className={`font-mono text-xl font-bold ${thiColor}`}>{Math.min(10, thiScore)}</span>
                    <span className="text-[10px] mb-1">/ 10</span>
                </div>
                <div className="w-full h-1 bg-slate-700 mt-1 rounded-full overflow-hidden">
                    <div className={`h-full ${thiScore > 7 ? 'bg-red-500' : thiScore > 3 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{width: `${Math.min(100, thiScore*10)}%`}}></div>
                </div>
             </div>
        </div>
    );
};

// --- Water Ingress System ---
const WaterIngressSystem: React.FC<{ design: TunnelDesign, waterLevel: number, clipPlane: THREE.Plane }> = ({ design, waterLevel, clipPlane }) => {
  const count = 300;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * design.width * 0.8,
        (Math.random()) * design.height/2, 
        (Math.random() - 0.5) * 40
      ),
      speed: 0.05 + Math.random() * 0.1
    }));
  }, [count, design]);

  useFrame(() => {
    if (!meshRef.current) return;
    if (waterLevel <= 0) {
        meshRef.current.visible = false;
        return;
    }
    meshRef.current.visible = true;

    particles.forEach((particle, i) => {
      particle.position.y -= particle.speed;
      if (particle.position.y < -design.height/2) {
        particle.position.y = design.height/2;
        particle.position.x = (Math.random() - 0.5) * design.width * 0.8;
      }
      dummy.position.copy(particle.position);
      dummy.scale.setScalar(0.05);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#60a5fa" transparent opacity={0.6} clippingPlanes={[clipPlane]} />
    </instancedMesh>
  );
};

// --- Stress Halo ---
const StressHalo: React.FC<{ design: TunnelDesign, sliceZ: number, clipPlane: THREE.Plane }> = ({ design, sliceZ, clipPlane }) => {
    const radius = (design.width / 2) + 0.5;
    const geometry = useMemo(() => {
        const geo = new THREE.RingGeometry(radius, radius + 2, 64);
        const colors = [];
        const pos = geo.attributes.position;
        const color = new THREE.Color();
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const angle = Math.atan2(y, x);
            const normalizedAngle = Math.abs(Math.cos(angle));
            color.setHSL(0.6 - (normalizedAngle * 0.6), 1.0, 0.5); 
            colors.push(color.r, color.g, color.b);
        }
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        return geo;
    }, [radius]);

    return (
        <mesh position={[0, 0, sliceZ]} geometry={geometry}>
            <meshBasicMaterial vertexColors side={THREE.DoubleSide} transparent opacity={0.5} depthWrite={false} clippingPlanes={[clipPlane]} />
        </mesh>
    );
};

// --- Bending Moment Diagram (BMD) ---
const BendingMomentDiagram: React.FC<{ design: TunnelDesign, sliceZ: number }> = ({ design, sliceZ }) => {
    // Generate texture dynamically
    const texture = useMemo(() => {
        const size = 1024;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return new THREE.CanvasTexture(canvas);

        const cx = size / 2;
        const cy = size / 2;
        const radius = (size / 3); 
        const momentScale = 80; // Scale factor for visual

        ctx.clearRect(0,0,size,size);
        
        // Draw Tunnel Outline
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw Moment Diagram
        // M = M_max * cos(2*theta)
        ctx.strokeStyle = '#ef4444'; // Red
        ctx.lineWidth = 6;
        ctx.beginPath();
        for (let i = 0; i <= 360; i++) {
            const theta = (i * Math.PI) / 180;
            const moment = Math.cos(2 * theta); // -1 to 1
            const r = radius + (moment * momentScale);
            const x = cx + r * Math.cos(theta);
            const y = cy + r * Math.sin(theta);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // Labels
        ctx.font = 'bold 32px JetBrains Mono';
        ctx.fillStyle = '#ef4444';
        ctx.fillText("M(+)", cx + radius + momentScale, cy);
        ctx.fillText("M(-)", cx, cy - radius + momentScale);

        return new THREE.CanvasTexture(canvas);
    }, [design.width]);

    return (
        <mesh position={[0, 0, sliceZ + 0.05]} rotation={[0, 0, 0]}>
            <planeGeometry args={[design.width * 2.5, design.width * 2.5]} />
            <meshBasicMaterial map={texture} transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
    );
};

// --- Surface Settlement Frustum ---
const SettlementVolume: React.FC<{ design: TunnelDesign, sliceZ: number }> = ({ design, sliceZ }) => {
    // Width at surface is usually depth * factor + diameter
    const troughWidth = design.width + (design.depth * 0.8); 
    const depth = design.depth;
    
    // Custom Shader for Gradient Fade
    const material = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            colorBottom: { value: new THREE.Color(1, 0, 0) }, // Red at tunnel
            colorTop: { value: new THREE.Color(1, 1, 0) }, // Yellow at surface
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 colorBottom;
            uniform vec3 colorTop;
            varying vec2 vUv;
            void main() {
                // vUv.y goes from 0 (bottom) to 1 (top)
                float opacity = 0.5 - (vUv.y * 0.5); // Fade out as it goes up
                vec3 finalColor = mix(colorBottom, colorTop, vUv.y);
                gl_FragColor = vec4(finalColor, opacity);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
    }), []);

    return (
        <mesh position={[0, depth / 2, sliceZ]} rotation={[0, 0, 0]}>
             {/* Frustum: Top Radius, Bottom Radius, Height */}
            <cylinderGeometry args={[troughWidth / 2, design.width / 2, depth, 32, 1, true]} />
            <primitive object={material} />
        </mesh>
    );
};

// --- Hydrostatic Vector Field ---
const HydrostaticVectors: React.FC<{ design: TunnelDesign, waterLevel: number, curve: THREE.Curve<THREE.Vector3> }> = ({ design, waterLevel, curve }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const count = 100; // Total vectors
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const radius = design.width / 2;

    // Generate instances
    useFrame(() => {
        if (!meshRef.current) return;
        
        let idx = 0;
        const rings = 10;
        const vectorsPerRing = 10;
        const length = 40;

        for (let i = 0; i < rings; i++) {
            const t = i / (rings - 1);
            const point = curve.getPointAt(t);
            const tangent = curve.getTangentAt(t);
            const normal = new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), 0); // Base Up
            // Simplified Frenet for vertical:
            const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
            const realNormal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

            for (let j = 0; j < vectorsPerRing; j++) {
                 const angle = (j / vectorsPerRing) * Math.PI * 2;
                 // Position on circle surface
                 const localPos = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
                 
                 // Apply rotation to match curve tangent?
                 // Simple approximation: Just offset from point
                 const worldPos = point.clone().add(localPos); // Warning: this doesn't rotate ring with tangent
                 
                 // Calculate Depth below GWT
                 const depth = waterLevel - worldPos.y;
                 
                 if (depth > 0) {
                     dummy.position.copy(worldPos);
                     dummy.lookAt(point); // Point inward
                     const scale = Math.min(2.0, depth * 0.1); // Scale vector length by pressure
                     dummy.scale.set(1, 1, scale * 3); // Make arrow long
                     dummy.updateMatrix();
                     meshRef.current.setMatrixAt(idx++, dummy.matrix);
                 } else {
                     // Hide if above water
                     dummy.scale.set(0,0,0);
                     dummy.updateMatrix();
                     meshRef.current.setMatrixAt(idx++, dummy.matrix);
                 }
            }
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <cylinderGeometry args={[0.05, 0.05, 1]} /> {/* Arrow Shaft */}
            <meshStandardMaterial color="#3b82f6" />
        </instancedMesh>
    )
};


// --- Alignment Deviation ---
const AlignmentSystem: React.FC<{ curve: THREE.Curve<THREE.Vector3>, clipPlane: THREE.Plane }> = ({ curve, clipPlane }) => {
    const tubeGeo = useMemo(() => new THREE.TubeGeometry(curve, 64, 0.05, 8, false), [curve]);
    return (
        <group>
            <mesh geometry={tubeGeo}>
                <meshStandardMaterial color="lime" clippingPlanes={[clipPlane]} />
            </mesh>
        </group>
    );
};

// --- Grouting Fan ---
const GroutingFan: React.FC<{ radius: number, clipPlane: THREE.Plane }> = ({ radius, clipPlane }) => {
    const piles = 12;
    const length = 8;
    return (
        <group position={[0, 0, -5]}>
            {new Array(piles).fill(0).map((_, i) => {
                const angle = (i / piles) * Math.PI;
                return (
                    <mesh key={i} rotation={[0, 0, angle]}>
                        <group rotation={[Math.PI/12, 0, 0]}> 
                            <mesh position={[0, length/2, 0]}>
                                <cylinderGeometry args={[0.05, 0.05, length]} />
                                <meshStandardMaterial color="#fbbf24" transparent opacity={0.7} clippingPlanes={[clipPlane]} />
                            </mesh>
                        </group>
                    </mesh>
                )
            })}
        </group>
    );
};

// --- Segmented Lining (Detailed TBM) ---
const SegmentedLining: React.FC<{ design: TunnelDesign, clipPlane: THREE.Plane, onClick: (e: any, props: any) => void, curve: THREE.Curve<THREE.Vector3> }> = ({ design, clipPlane, onClick, curve }) => {
  const segmentCount = design.segmentCount || 6;
  const ringWidth = design.ringWidth || 1.5;
  const tunnelLength = 40;
  const numRings = Math.ceil(tunnelLength / ringWidth);
  const outerRadius = design.width / 2;
  const innerRadius = outerRadius - design.wallThickness;
  
  // Calculate Angles
  const keyAngle = (20 * Math.PI) / 180; // 20 degrees for Key
  const regularAngle = (2 * Math.PI - keyAngle) / segmentCount;
  const gap = 0.02; // Gap between segments for visual distinction

  // Geometries for instancing
  const regularGeo = useMemo(() => new THREE.CylinderGeometry(outerRadius, outerRadius, ringWidth - 0.05, 32, 1, true, gap/2, regularAngle - gap), [outerRadius, ringWidth, regularAngle]);
  const keyGeo = useMemo(() => new THREE.CylinderGeometry(outerRadius, outerRadius, ringWidth - 0.05, 16, 1, true, gap/2, keyAngle - gap), [outerRadius, ringWidth, keyAngle]);
  
  return (
    <group>
        {new Array(numRings).fill(0).map((_, rIndex) => {
             // Position along curve
             const t = rIndex / (numRings - 1);
             const pos = curve.getPointAt(t);
             const tangent = curve.getTangentAt(t);
             
             // Stagger rotation every other ring
             const rotationOffset = rIndex % 2 === 0 ? 0 : regularAngle / 2;
             
             return (
                 <group key={rIndex} position={pos} lookAt={pos.clone().add(tangent)}>
                     {/* Manually rotate 90 deg because lookAt aligns +Z, but Cylinder is +Y aligned default, wait... we rotate group, then children? */}
                     {/* Correct: The group looks down the curve tangent. We need to rotate the children to align the cylinder axis with Z */}
                     <group rotation={[Math.PI/2, 0, rotationOffset]}>
                         {/* Regular Segments */}
                         {new Array(segmentCount).fill(0).map((_, sIndex) => (
                             <mesh 
                                key={`reg-${sIndex}`} 
                                geometry={regularGeo} 
                                rotation={[0, sIndex * regularAngle, 0]}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClick(e, { title: 'TBM Segment', props: { type: 'Standard', id: `R${rIndex}-S${sIndex+1}` }});
                                }}
                            >
                                 <meshStandardMaterial color="#d4d4d8" roughness={0.6} side={THREE.DoubleSide} clippingPlanes={[clipPlane]} />
                             </mesh>
                         ))}
                         {/* Key Segment */}
                         <mesh 
                            geometry={keyGeo} 
                            rotation={[0, segmentCount * regularAngle, 0]}
                            onClick={(e) => {
                                e.stopPropagation();
                                onClick(e, { title: 'Key Segment', props: { type: 'Wedge-K', id: `R${rIndex}-K` }});
                            }}
                         >
                             <meshStandardMaterial color="#cbd5e1" roughness={0.5} side={THREE.DoubleSide} clippingPlanes={[clipPlane]} />
                         </mesh>
                     </group>
                 </group>
             )
        })}
    </group>
  );
};

// --- NATM Support (Detailed & Parametric) ---
const NATMSupport: React.FC<{ design: TunnelDesign, stage: number, clipPlane: THREE.Plane, onClick: (e: any, props: any) => void, curve: THREE.Curve<THREE.Vector3> }> = ({ design, stage, clipPlane, onClick, curve }) => {
  const outerRadius = design.width / 2;
  // We use TubeGeometry for the shotcrete shell to follow the curve smoothly
  const shotcreteGeo = useMemo(() => new THREE.TubeGeometry(curve, 64, outerRadius, 32, false), [curve, outerRadius]);

  const length = 40;
  
  // Rock Bolts System - Updated to follow curve
  const bolts = useMemo(() => {
      const items = [];
      const boltSpacing = design.boltSpacing || 1.5;
      const boltLen = design.boltLength || 3;
      
      const numRings = Math.floor(length / boltSpacing);
      const boltsPerRing = 7; // Radial count
      
      for(let i=0; i<numRings; i++) {
          const t = i / (numRings - 1);
          const pos = curve.getPointAt(t);
          const tangent = curve.getTangentAt(t);
          // Frenet Frame
          const normal = new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(1,0,0), 0);
          const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
          const up = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

          for(let j=0; j<boltsPerRing; j++) {
              const angle = (j / (boltsPerRing-1)) * Math.PI; // spread over top 180
              // Calculate radial direction in the plane perpendicular to tangent
              const radialDir = new THREE.Vector3()
                  .addScaledVector(binormal, Math.cos(angle))
                  .addScaledVector(up, Math.sin(angle))
                  .normalize();
              
              // Rotation quaternion to align bolt (Y-up cylinder) with radialDir
              const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), radialDir);
              
              items.push({ pos: pos, quat: quaternion, len: boltLen }); 
          }
      }
      return items;
  }, [length, design.boltSpacing, design.boltLength, curve]);

  return (
    <group>
        {/* Shotcrete Shell */}
        {stage >= 1 && (
            <mesh 
                geometry={shotcreteGeo} 
                onClick={(e) => {
                    e.stopPropagation();
                    onClick(e, { title: 'Top Heading SCL', props: { material: 'Shotcrete', thickness: `${design.wallThickness*1000}mm`, age: '3 days' }});
                }}
            >
                <meshStandardMaterial color="#a1a1aa" roughness={0.9} side={THREE.DoubleSide} clippingPlanes={[clipPlane]} />
            </mesh>
        )}
        
        {/* Steel Mesh (Wireframe Overlay) */}
        {stage >= 1 && (
            <mesh 
                geometry={shotcreteGeo} 
                scale={[0.99, 0.99, 0.99]} 
            >
                <meshBasicMaterial color="#475569" wireframe clippingPlanes={[clipPlane]} transparent opacity={0.3} />
            </mesh>
        )}

        {/* Rock Bolts */}
        {stage >= 1 && (
             <group>
                 {bolts.map((b, i) => (
                     <group key={i} position={b.pos} quaternion={b.quat}>
                         {/* Bolt Shaft */}
                         <mesh position={[0, b.len/2 + outerRadius, 0]}>
                             <cylinderGeometry args={[0.05, 0.05, b.len]} />
                             <meshStandardMaterial color="#1e3a8a" clippingPlanes={[clipPlane]} />
                         </mesh>
                         {/* Face Plate */}
                         <mesh position={[0, outerRadius, 0]}>
                             <boxGeometry args={[0.3, 0.05, 0.3]} />
                             <meshStandardMaterial color="#172554" clippingPlanes={[clipPlane]} />
                         </mesh>
                     </group>
                 ))}
             </group>
        )}
    </group>
  );
};

// --- Geology Volume (Enhanced with Procedural Textures) ---

// Extract single layer mesh to use hooks correctly
const GeologyLayerMesh: React.FC<{
  layer: GeologicalLayer;
  yPos: number;
  depth: number;
  clipPlane: THREE.Plane;
  onClick: (e: any, props: any) => void;
  isHighlighted: boolean;
  currentY: number;
}> = ({ layer, yPos, depth, clipPlane, onClick, isHighlighted, currentY }) => {
    // Generate texture using hook at component level
    const texture = useMemo(() => {
        const tex = generateGeoTexture(layer.type, layer.color);
        // Scale texture repeat to keep visual density roughly consistent.
        // We use a base scale factor (e.g. 1 unit of texture = 5 meters)
        // Texture is 512px. Let's assume it maps to a 5x5m area by default.
        // The mesh top face is 30x40. Side face is 30xThickness. 
        // We set repeat to match the largest dimension for reasonable density.
        tex.repeat.set(4, Math.max(1, layer.thickness / 5)); 
        return tex;
    }, [layer.type, layer.color, layer.thickness]);
    
    return (
       <mesh 
        position={[0, yPos + depth, 0]}
        onClick={(e) => {
            e.stopPropagation();
            onClick(e, { title: `Layer: ${layer.type}`, props: { density: `${layer.density} kN/m³`, depth: `${currentY}m`, permeability: layer.permeability }});
        }}
       >
          <boxGeometry args={[30, layer.thickness, 40]} />
          <meshStandardMaterial 
            map={texture}
            color={layer.color} 
            transparent 
            opacity={isHighlighted ? 0.8 : 0.4} 
            depthWrite={false}
            side={THREE.DoubleSide}
            clippingPlanes={[clipPlane]}
            emissive={isHighlighted ? layer.color : "black"}
            emissiveIntensity={isHighlighted ? 0.3 : 0}
            roughness={0.8}
          />
       </mesh>
    );
};

const GeologyVolume: React.FC<{ layers: GeologicalLayer[], depth: number, clipPlane: THREE.Plane, onClick: (e: any, props: any) => void, highlightedId?: string | null }> = ({ layers, depth, clipPlane, onClick, highlightedId }) => {
  let currentY = 0;
  
  return (
    <group position={[0, 0, 0]}>
       {layers.map((layer) => {
         const yPos = -currentY - (layer.thickness / 2);
         // Capture the depth before incrementing for the label
         const layerDepthLabel = currentY + layer.thickness;
         currentY += layer.thickness;
         const isHighlighted = highlightedId === layer.id;
         
         return (
             <GeologyLayerMesh 
                key={layer.id}
                layer={layer}
                yPos={yPos}
                depth={depth}
                clipPlane={clipPlane}
                onClick={onClick}
                isHighlighted={isHighlighted}
                currentY={layerDepthLabel}
             />
         );
       })}
       {/* Reference Surface */}
       <gridHelper position={[0, depth, 0]} args={[50, 50]} />
    </group>
  );
};

// --- GWT Visualizer ---
const GWTVisualizer: React.FC<{ level: number, radius: number, clipPlane: THREE.Plane }> = ({ level, radius, clipPlane }) => {
    const y = (radius) + level; 
    
    return (
        <mesh position={[0, y, 0]} rotation={[-Math.PI/2, 0, 0]}>
             <planeGeometry args={[30, 40]} />
             <meshBasicMaterial color="#3b82f6" transparent opacity={0.2} side={THREE.DoubleSide} clippingPlanes={[clipPlane]} />
        </mesh>
    );
};


// --- Main Scene Component ---
const TunnelScene: React.FC<ThreeViewProps & { clipPlane: THREE.Plane, setInspect: (e: any, d: any) => void }> = ({ design, layers, slice, simulation, clipPlane, setInspect, highlightedLayerId }) => {
    const zPos = ((slice / 100) * 40) - 20;
    useFrame(() => { clipPlane.constant = -zPos; });

    // Generate Alignment Curve
    const alignmentCurve = useMemo(() => {
        const points = [];
        const length = 40;
        const R = design.horizontalRadius || 10000; // Avoid divide by zero
        const G = design.verticalGrade / 100; // Percentage to decimal
        
        for(let i=0; i<=20; i++) {
            const z = (i/20) * length - length/2;
            // Horizontal Curve: x ≈ z^2 / 2R (Small angle approx)
            const x = (z * z) / (2 * R);
            // Vertical Grade: y = z * grade
            const y = z * G;
            points.push(new THREE.Vector3(x, y, z));
        }
        return new THREE.CatmullRomCurve3(points);
    }, [design.horizontalRadius, design.verticalGrade]);

    return (
        <>
            <group position={[0, 0, 0]}>
                {design.method === ConstructionMethod.TBM && design.shape === TunnelShape.Circular ? (
                    <SegmentedLining design={design} clipPlane={clipPlane} onClick={setInspect} curve={alignmentCurve} />
                ) : (
                    <NATMSupport design={design} stage={simulation.natmSequence} clipPlane={clipPlane} onClick={setInspect} curve={alignmentCurve} />
                )}
            </group>
            <GeologyVolume layers={layers} depth={design.depth} clipPlane={clipPlane} onClick={setInspect} highlightedId={highlightedLayerId} />
            
            <WaterIngressSystem design={design} waterLevel={simulation.waterTableLevel} clipPlane={clipPlane} />
            {simulation.waterTableLevel > -20 && <GWTVisualizer level={simulation.waterTableLevel} radius={design.height/2} clipPlane={clipPlane} />}
            
            {simulation.showHydrostaticVectors && simulation.waterTableLevel > -10 && (
                <HydrostaticVectors design={design} waterLevel={simulation.waterTableLevel} curve={alignmentCurve} />
            )}

            {simulation.showStress && <StressHalo design={design} sliceZ={zPos} clipPlane={clipPlane} />}
            {simulation.showGrouting && <GroutingFan radius={design.width/2} clipPlane={clipPlane} />}
            {simulation.showAlignment && <AlignmentSystem curve={alignmentCurve} clipPlane={clipPlane} />}
            
            {/* New Advanced Visualizations */}
            {simulation.showBMD && <BendingMomentDiagram design={design} sliceZ={zPos} />}
            {simulation.showSettlement && <SettlementVolume design={design} sliceZ={zPos} />}

            {/* Cut Plane Visualizer */}
            <mesh position={[0, 0, zPos]}>
                <planeGeometry args={[30, 30]} />
                <meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.1} />
            </mesh>
        </>
    );
};

export const ThreeView: React.FC<ThreeViewProps> = ({ design, layers, slice, simulation, highlightedLayerId }) => {
  const clipPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, -1), 0), []);
  const [inspectData, setInspectData] = useState<any | null>(null);
  const [showHUD, setShowHUD] = useState(true);

  const handleMiss = () => setInspectData(null);
  const handleInspect = (e: any, data: any) => {
    setInspectData({ point: e.point, title: data.title, props: data.props });
  };

  return (
    <div className="w-full h-full bg-slate-900 rounded-2xl overflow-hidden shadow-inner relative group select-none">
      
      {/* Borehole Log Overlay */}
      {simulation.showBorehole && (
          <div className="absolute top-4 left-4 z-20">
              <BoreholeLog layers={layers} depth={design.depth} />
          </div>
      )}

      {/* Advanced Metrics Overlay */}
      <div className="absolute bottom-4 left-4 z-20">
          <AdvancedMetricsPanel layers={layers} design={design} waterLevel={simulation.waterTableLevel} />
      </div>

      {/* 3D View Control HUD */}
      <div className={`absolute top-4 right-4 z-20 transition-all duration-300 ${showHUD ? 'w-48' : 'w-10 h-10'} flex flex-col items-end`}>
          <button 
             onClick={() => setShowHUD(!showHUD)} 
             className="bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-full shadow-lg backdrop-blur-md mb-2 z-30 border border-slate-600"
          >
             {showHUD ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
          </button>
          
          {showHUD && (
              <div className="bg-slate-800/80 backdrop-blur-md p-3 rounded-xl border border-slate-600 shadow-xl w-full text-white text-xs space-y-2 animate-in slide-in-from-top-2">
                 <div className="font-bold border-b border-slate-600 pb-1 flex items-center gap-2">
                    <ViewfinderCircleIcon className="w-4 h-4 text-blue-400"/> Scene Controls
                 </div>
                 <div className="flex justify-between">
                    <span>Camera</span>
                    <span className="text-slate-400">Orbit</span>
                 </div>
                 <div className="flex justify-between">
                    <span>Clip Plane</span>
                    <span className="text-slate-400">{slice}%</span>
                 </div>
                 <div className="flex justify-between">
                    <span>Layers</span>
                    <span className="text-slate-400">{layers.length} Active</span>
                 </div>
                 {simulation.waterTableLevel > 0 && (
                     <div className="text-blue-300 font-semibold bg-blue-900/30 p-1 rounded text-center">
                        Hydrostatic Pressure
                     </div>
                 )}
              </div>
          )}
      </div>

      <Canvas 
        camera={{ position: [15, 8, 15], fov: 45 }}
        gl={{ localClippingEnabled: true }}
        onPointerMissed={handleMiss}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 20, 10]} intensity={1.2} />
        <directionalLight position={[-5, 5, 20]} intensity={0.8} />
        
        <TunnelScene 
            design={design} 
            layers={layers} 
            slice={slice} 
            simulation={simulation}
            clipPlane={clipPlane} 
            setInspect={handleInspect}
            highlightedLayerId={highlightedLayerId}
        />
        
        <Inspector data={inspectData} clear={() => setInspectData(null)} />
        
        <OrbitControls 
          enableDamping 
          ref={(ref: any) => {
            if (ref) {
              ref.minDistance = 5;
              ref.maxDistance = 50;
            }
          }} 
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};
