import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function CommunitySphereCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL initialization fallback for CommunitySphereCanvas:', e);
      return;
    }

    const group = new THREE.Group();
    scene.add(group);

    // Wireframe Sphere
    const geom = new THREE.IcosahedronGeometry(2, 1);
    const mat = new THREE.MeshPhongMaterial({
      color: 0x36a395,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const mesh = new THREE.Mesh(geom, mat);
    group.add(mesh);

    // Floating Activity Particles
    const particlesGeom = new THREE.BufferGeometry();
    const particlesCount = 30;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 6;
    }
    particlesGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({ size: 0.05, color: 0x36a395 });
    const particlesMesh = new THREE.Points(particlesGeom, particlesMat);
    group.add(particlesMesh);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x36a395, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    camera.position.z = 5;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      group.rotation.y += 0.002;
      group.rotation.x += 0.001;
      if (renderer) renderer.render(scene, camera);
    };

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 600;
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
