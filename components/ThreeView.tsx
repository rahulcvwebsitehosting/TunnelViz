import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { TunnelDesign, GeologicalLayer, TunnelShape } from '../types';

interface ThreeViewProps {
  design: TunnelDesign;
  layers: GeologicalLayer[];
}

const TunnelMesh: React.FC<{ design: TunnelDesign }> = ({ design }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  let geometry: THREE.BufferGeometry;

  if (design.shape === TunnelShape.Circular) {
    // Inner and Outer tubes
    const outerRadius = design.width / 2;
    const innerRadius = outerRadius - design.wallThickness;
    const length = 50;
    
    const outerGeo = new THREE.CylinderGeometry(outerRadius, outerRadius, length, 32, 1, true);
    const innerGeo = new THREE.CylinderGeometry(innerRadius, innerRadius, length, 32, 1, true);
    // In a real app we would merge these or use CSG, for visual simple:
    // Just render the inner lining
    geometry = new THREE.CylinderGeometry(outerRadius, outerRadius, length, 32, 1, true);
    // Orient horizontally
  } else if (design.shape === TunnelShape.Rectangular) {
    const width = design.width;
    const height = design.height;
    const length = 50;
    geometry = new THREE.BoxGeometry(width, height, length);
  } else {
    // Horseshoe - approximated with cylinder for MVP or complex shape
    // Using a scaled cylinder
    const radius = design.width / 2;
    const length = 50;
    geometry = new THREE.CylinderGeometry(radius, radius, length, 32, 1, true);
  }

  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
       {/* Concrete Lining */}
       <mesh ref={meshRef} position={[0, 0, 0]}>
        <primitive object={geometry} />
        <meshStandardMaterial 
          color="#a0a0a0" 
          side={THREE.DoubleSide} 
          roughness={0.7}
        />
      </mesh>
      
      {/* Floor/Invert for visual reference inside */}
      <mesh position={[0, -design.height/2 + 0.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[design.width * 0.8, 50]} />
        <meshStandardMaterial color="#555" />
      </mesh>
    </group>
  );
};

const GroundLayers: React.FC<{ layers: GeologicalLayer[], tunnelDepth: number }> = ({ layers, tunnelDepth }) => {
  // We need to stack layers starting from surface (y=0) downwards.
  // The tunnel is located at y = -tunnelDepth
  
  let currentDepth = 0;
  
  // Visualize a slice of ground
  return (
    <group position={[15, 0, 0]}> {/* Offset to side to see profile */}
      {layers.map((layer, idx) => {
        const yPos = -currentDepth - (layer.thickness / 2);
        currentDepth += layer.thickness;
        
        return (
          <mesh key={layer.id} position={[0, yPos, 0]}>
            <boxGeometry args={[10, layer.thickness, 10]} />
            <meshStandardMaterial color={layer.color} transparent opacity={0.6} />
            {/* Layer Label */}
          </mesh>
        );
      })}
    </group>
  );
};

export const ThreeView: React.FC<ThreeViewProps> = ({ design, layers }) => {
  return (
    <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden shadow-inner relative">
      <div className="absolute top-4 left-4 z-10 bg-black/50 text-white p-2 rounded text-xs font-mono">
        Left Mouse: Rotate <br/> Right Mouse: Pan <br/> Scroll: Zoom
      </div>
      <Canvas camera={{ position: [10, 5, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <directionalLight position={[-5, 5, 5]} intensity={0.5} />
        
        <TunnelMesh design={design} />
        <GroundLayers layers={layers} tunnelDepth={design.depth} />
        
        <Grid infiniteGrid sectionColor="#4f4f4f" cellColor="#333" fadeDistance={50} />
        <OrbitControls />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};
