
"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeDecorationProps {
  type: 'heart' | 'star' | 'cube' | 'butterfly' | 'candle';
  className?: string;
  color?: string;
}

export const ThreeDecoration: React.FC<ThreeDecorationProps> = ({ type, className, color = '#FFD1DC' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    let group = new THREE.Group();

    if (type === 'butterfly') {
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.bezierCurveTo(2, 2, 4, 1, 3, -2);
      wingShape.bezierCurveTo(2, -4, 0, -2, 0, 0);
      
      const wingGeometry = new THREE.ShapeGeometry(wingShape);
      const wingMaterial = new THREE.MeshPhongMaterial({ 
        color: new THREE.Color(color), 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });

      const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
      const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
      rightWing.scale.x = -1;
      
      group.add(leftWing);
      group.add(rightWing);
      group.scale.set(0.1, 0.1, 0.1);
      scene.add(group);

      const animateWings = () => {
        const time = Date.now() * 0.01;
        leftWing.rotation.y = Math.sin(time) * 0.8;
        rightWing.rotation.y = -Math.sin(time) * 0.8;
      };
      
      (group as any).update = animateWings;
    } else if (type === 'candle') {
      const cylinder = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 32);
      const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFDD0 });
      const candleBody = new THREE.Mesh(cylinder, bodyMaterial);
      
      const flameGeometry = new THREE.SphereGeometry(0.1, 16, 16);
      const flameMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFF4500,
        emissive: 0xFF4500,
        emissiveIntensity: 1
      });
      const flame = new THREE.Mesh(flameGeometry, flameMaterial);
      flame.position.y = 0.5;
      flame.scale.set(1, 1.8, 1);
      
      group.add(candleBody);
      group.add(flame);
      scene.add(group);

      const animateFlame = () => {
        const time = Date.now() * 0.01;
        flame.scale.y = 1.8 + Math.sin(time * 5) * 0.2;
        flame.position.x = Math.sin(time * 3) * 0.02;
      };
      (group as any).update = animateFlame;
    } else if (type === 'heart') {
      const heartShape = new THREE.Shape();
      heartShape.moveTo(0, 0);
      heartShape.bezierCurveTo(0, 0, -2, 2, -5, 2);
      heartShape.bezierCurveTo(-10, 2, -10, -5, -10, -5);
      heartShape.bezierCurveTo(-10, -10, -5, -15, 0, -20);
      heartShape.bezierCurveTo(5, -15, 10, -10, 10, -5);
      heartShape.bezierCurveTo(10, -5, 10, 2, 5, 2);
      heartShape.bezierCurveTo(2, 2, 0, 0, 0, 0);
      
      const geometry = new THREE.ExtrudeGeometry(heartShape, { depth: 2, bevelEnabled: true });
      const material = new THREE.MeshPhongMaterial({ color: new THREE.Color(color) });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(0.03, 0.03, 0.03);
      mesh.rotation.x = Math.PI;
      group.add(mesh);
      scene.add(group);
    }

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 2);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    camera.position.z = 2;

    const animate = () => {
      requestAnimationFrame(animate);
      group.rotation.y += 0.01;
      if ((group as any).update) (group as any).update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [type, color]);

  return <div ref={containerRef} className={className} />;
};
