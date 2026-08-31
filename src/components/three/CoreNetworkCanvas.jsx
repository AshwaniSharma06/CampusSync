import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function CoreNetworkCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL initialization fallback for CoreNetworkCanvas:', e);
      return;
    }

    const group = new THREE.Group();
    scene.add(group);

    // Central Core Sphere
    const coreGeom = new THREE.IcosahedronGeometry(1.5, 2);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x36a395,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    group.add(coreMesh);

    // Orbiting Nodes
    const nodeColors = [0x36a395, 0x637cff, 0xd5b269, 0x36a395, 0xfcfcfa, 0x637cff];
    const nodes = [];

    for (let i = 0; i < 6; i++) {
      const nodePivot = new THREE.Group();
      const angle = (i / 6) * Math.PI * 2;
      const distance = 3.5;

      const nodeGeom = new THREE.SphereGeometry(0.2, 12, 12);
      const nodeMat = new THREE.MeshPhongMaterial({
        color: nodeColors[i],
        emissive: nodeColors[i],
        emissiveIntensity: 0.5,
      });
      const node = new THREE.Mesh(nodeGeom, nodeMat);

      node.position.set(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        (Math.random() - 0.5) * 2
      );
      nodePivot.add(node);

      // Connection Path
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(
          node.position.x * 0.5,
          node.position.y * 1.2,
          node.position.z * 0.5
        ),
        node.position
      );
      const points = curve.getPoints(30);
      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x36a395,
        transparent: true,
        opacity: 0.2,
      });
      const line = new THREE.Line(lineGeom, lineMat);
      nodePivot.add(line);

      group.add(nodePivot);
      nodes.push({ pivot: nodePivot, speed: 0.005 + Math.random() * 0.005 });
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x71d8c8, 1.5, 20);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    camera.position.z = 8;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      group.rotation.y += 0.002;
      nodes.forEach((n) => {
        n.pivot.rotation.z += n.speed;
      });
      if (renderer) renderer.render(scene, camera);
    };

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 400;
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
