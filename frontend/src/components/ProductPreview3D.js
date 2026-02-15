import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';

// Loading component
const Loader = () => (
  <Html center>
    <div className="flex flex-col items-center gap-2">
      <div className="spinner"></div>
      <span className="text-sm text-slate-500">Laddar 3D...</span>
    </div>
  </Html>
);

// Mug Component
const Mug = ({ color = '#FFFFFF' }) => {
  const meshRef = useRef();
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Mug body */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.7, 1.6, 32]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      
      {/* Handle */}
      <mesh position={[0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.35, 0.08, 16, 32, Math.PI]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
      </mesh>
      
      {/* Inner */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.7, 0.6, 1.4, 32]} />
        <meshStandardMaterial color="#EEEEEE" side={THREE.BackSide} />
      </mesh>
    </group>
  );
};

// T-shirt Component
const TShirt = ({ color = '#FFFFFF' }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Main body */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[2, 2.5, 0.2]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.8}
          metalness={0}
        />
      </mesh>
      
      {/* Left sleeve */}
      <mesh position={[-1.3, 0.5, 0]} rotation={[0, 0, -0.3]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.15]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      
      {/* Right sleeve */}
      <mesh position={[1.3, 0.5, 0]} rotation={[0, 0, 0.3]} castShadow>
        <boxGeometry args={[0.8, 0.8, 0.15]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  );
};

// Poster/Canvas Component
const PosterCanvas = ({ color = '#FFFFFF' }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.15;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Frame */}
      <mesh position={[0, 0, -0.05]} castShadow>
        <boxGeometry args={[2.4, 3.2, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>
      
      {/* Canvas */}
      <mesh position={[0, 0, 0.01]} castShadow>
        <planeGeometry args={[2.2, 3]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.5}
        />
      </mesh>
    </group>
  );
};

// Phone Case Component
const PhoneCase = ({ color = '#FFFFFF' }) => {
  const meshRef = useRef();
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.008;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Case body */}
      <mesh castShadow>
        <boxGeometry args={[1.2, 2.4, 0.15]} />
        <meshStandardMaterial 
          color={color}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      
      {/* Camera cutout */}
      <mesh position={[0.3, 0.9, 0.08]}>
        <cylinderGeometry args={[0.15, 0.15, 0.05, 32]} />
        <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};

// Tote Bag Component
const ToteBag = ({ color = '#F5F5DC' }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Bag body */}
      <mesh position={[0, -0.3, 0]} castShadow>
        <boxGeometry args={[1.8, 2, 0.3]} />
        <meshStandardMaterial 
          color={color}
          roughness={0.9}
        />
      </mesh>
      
      {/* Left handle */}
      <mesh position={[-0.5, 1, 0]} castShadow>
        <torusGeometry args={[0.4, 0.05, 8, 16, Math.PI]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      
      {/* Right handle */}
      <mesh position={[0.5, 1, 0]} castShadow>
        <torusGeometry args={[0.4, 0.05, 8, 16, Math.PI]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  );
};

// Hoodie Component
const Hoodie = ({ color = '#333333' }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Main body */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[2.2, 2.8, 0.4]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.85}
        />
      </mesh>
      
      {/* Hood */}
      <mesh position={[0, 1.6, -0.1]} castShadow>
        <sphereGeometry args={[0.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      
      {/* Left sleeve */}
      <mesh position={[-1.5, 0.3, 0]} rotation={[0, 0, -0.2]} castShadow>
        <boxGeometry args={[1, 1, 0.35]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      
      {/* Right sleeve */}
      <mesh position={[1.5, 0.3, 0]} rotation={[0, 0, 0.2]} castShadow>
        <boxGeometry args={[1, 1, 0.35]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
    </group>
  );
};

// Model selector
const ProductModel = ({ modelType, color }) => {
  switch (modelType) {
    case 'mug':
      return <Mug color={color} />;
    case 'tshirt':
      return <TShirt color={color} />;
    case 'hoodie':
      return <Hoodie color={color} />;
    case 'poster':
      return <PosterCanvas color={color} />;
    case 'phonecase':
      return <PhoneCase color={color} />;
    case 'totebag':
      return <ToteBag color={color} />;
    default:
      return <Mug color={color} />;
  }
};

// Main Preview Component
const ProductPreview3D = ({ modelType = 'mug', color = '#FFFFFF' }) => {
  return (
    <div className="canvas-container rounded-lg overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100" data-testid="3d-preview">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={<Loader />}>
          <ambientLight intensity={0.5} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            intensity={1}
            castShadow
          />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          
          <ProductModel modelType={modelType} color={color} />
          
          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.4}
            scale={10}
            blur={2}
            far={4}
          />
          
          <Environment preset="city" />
          
          <OrbitControls
            enableZoom={true}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
            minDistance={3}
            maxDistance={8}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ProductPreview3D;
