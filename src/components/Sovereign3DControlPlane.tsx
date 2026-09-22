import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, Pause, Shield, Cpu } from 'lucide-react';

export interface Sovereign3DControlPlaneProps {
  blockHeight?: number;
  systemStatus?: string;
  onNodeSelect?: (nodeId: number) => void;
}

export const Sovereign3DControlPlane: React.FC<Sovereign3DControlPlaneProps> = ({
  blockHeight = 849202,
  systemStatus = 'LOCKED_FROZEN_v1.2_LTS',
  onNodeSelect,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onNodeSelectRef = useRef(onNodeSelect);
  const [isRotating, setIsRotating] = useState(true);
  const [fps, setFps] = useState(60);

  useEffect(() => {
    onNodeSelectRef.current = onNodeSelect;
  }, [onNodeSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 450;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x09090b, 0.035);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 3, 9);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x09090b, 1);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const goldPointLight = new THREE.PointLight(0xffd700, 2.5, 20);
    goldPointLight.position.set(0, 0, 0);
    scene.add(goldPointLight);
    const cyanPointLight = new THREE.PointLight(0x00f3ff, 2.0, 25);
    cyanPointLight.position.set(5, 5, 5);
    scene.add(cyanPointLight);

    const omegaCoreGroup = new THREE.Group();
    const icoGeo = new THREE.IcosahedronGeometry(1.4, 0);
    const icoMat = new THREE.MeshPhongMaterial({
      color: 0xffd700,
      emissive: 0x8b6508,
      wireframe: true,
      shininess: 100,
    });
    omegaCoreGroup.add(new THREE.Mesh(icoGeo, icoMat));
    scene.add(omegaCoreGroup);

    const torusGeo = new THREE.TorusGeometry(2.8, 0.08, 16, 100);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x00f3ff,
      emissive: 0x0088aa,
      roughness: 0.2,
      metalness: 0.8,
    });
    const cyanTorus = new THREE.Mesh(torusGeo, torusMat);
    cyanTorus.rotation.x = Math.PI / 3;
    scene.add(cyanTorus);

    const nodeGroup = new THREE.Group();
    const nodeCount = 10;
    const orbitRadius = 4.2;
    const nodeMeshes: THREE.Mesh[] = [];
    const nodeGeo = new THREE.OctahedronGeometry(0.28, 0);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0x00ff66,
      emissive: 0x006622,
      roughness: 0.3,
    });

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(Math.cos(angle) * orbitRadius, 0, Math.sin(angle) * orbitRadius);
      nodeMesh.userData.nodeId = i;
      nodeMeshes.push(nodeMesh);
      nodeGroup.add(nodeMesh);
    }
    scene.add(nodeGroup);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const handlePointerDown = (event: PointerEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const selected = raycaster.intersectObjects(nodeMeshes)[0]?.object;
      if (selected && typeof selected.userData.nodeId === 'number') {
        onNodeSelectRef.current?.(selected.userData.nodeId);
      }
    };
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    let animationFrame = 0;
    let lastTime = performance.now();
    let frameCount = 0;
    const animate = (time: number) => {
      animationFrame = requestAnimationFrame(animate);
      frameCount++;
      if (time - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = time;
      }
      if (isRotating) {
        omegaCoreGroup.rotation.y += 0.01;
        cyanTorus.rotation.z += 0.008;
        nodeGroup.rotation.y += 0.006;
      }
      renderer.render(scene, camera);
    };
    animate(performance.now());

    return () => {
      cancelAnimationFrame(animationFrame);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      container.removeChild(renderer.domElement);
      icoGeo.dispose();
      icoMat.dispose();
      torusGeo.dispose();
      torusMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      renderer.dispose();
    };
  }, [isRotating]);

  return (
    <div className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden font-mono shadow-2xl relative">
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-zinc-950/90 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-amber-400 animate-pulse" />
          <div>
            <h2 className="text-sm font-bold text-zinc-100">3D Spatial Control Plane</h2>
            <p className="text-[10px] text-zinc-500">{systemStatus}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsRotating((rotating) => !rotating)}
          className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs flex items-center gap-1.5"
        >
          {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isRotating ? 'Pause' : 'Resume'}</span>
        </button>
      </div>
      <div ref={containerRef} className="w-full h-[450px]" />
      <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
        <span>FPS: {fps} | Block #{blockHeight}</span>
        <span className="text-emerald-400 flex items-center gap-1"><Shield className="w-4 h-4" /> 10/10 HSM</span>
      </div>
    </div>
  );
};
