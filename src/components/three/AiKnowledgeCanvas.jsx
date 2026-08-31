import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function AiKnowledgeCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId;
    const width = container.clientWidth || container.parentElement?.clientWidth || 400;
    const height = container.clientHeight || container.parentElement?.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL initialization fallback for AiKnowledgeCanvas:', e);
      return;
    }

    const group = new THREE.Group();
    scene.add(group);

    // AI Core
    const coreGeom = new THREE.SphereGeometry(1, 24, 24);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x36a395,
      emissive: 0x36a395,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.8,
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    group.add(coreMesh);

    // Outer Shell
    const shellGeom = new THREE.IcosahedronGeometry(2.5, 1);
    const shellMat = new THREE.MeshPhongMaterial({
      color: 0xfcfcfa,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
    const shellMesh = new THREE.Mesh(shellGeom, shellMat);
    group.add(shellMesh);

    // Knowledge Nodes
    const nodesCount = 15;
    for (let i = 0; i < nodesCount; i++) {
      const nodeGeom = new THREE.SphereGeometry(0.08, 8, 8);
      const nodeMat = new THREE.MeshBasicMaterial({ color: 0x36a395 });
      const node = new THREE.Mesh(nodeGeom, nodeMat);

      const phi = Math.acos(-1 + (2 * i) / nodesCount);
      const theta = Math.sqrt(nodesCount * Math.PI) * phi;

      node.position.setFromSphericalCoords(2.5, phi, theta);
      group.add(node);

      // Connection to Core
      const lineGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        node.position,
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x36a395,
        transparent: true,
        opacity: 0.1,
      });
      const line = new THREE.Line(lineGeom, lineMat);
      group.add(line);
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x36a395, 2, 10);
    pointLight.position.set(2, 2, 2);
    scene.add(pointLight);

    camera.position.z = 6;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      group.rotation.y += 0.003;
      group.rotation.x += 0.001;
      if (renderer) renderer.render(scene, camera);
    };

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || container.parentElement?.clientWidth || 400;
      const h = container.clientHeight || container.parentElement?.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const domElem = renderer.domElement;
    const handleContextLost = (event) => {
      event.preventDefault();
      cancelAnimationFrame(animationFrameId);
    };

    domElem.addEventListener('webglcontextlost', handleContextLost, false);
    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (domElem) {
        domElem.removeEventListener('webglcontextlost', handleContextLost);
      }
      if (container && domElem && container.contains(domElem)) {
        container.removeChild(domElem);
      }
      if (renderer) renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
}
