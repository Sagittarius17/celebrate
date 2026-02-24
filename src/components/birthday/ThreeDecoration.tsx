
"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeDecorationProps {
  type: 'heart' | 'candle';
  className?: string;
  color?: string;
}

export const ThreeDecoration: React.FC<ThreeDecorationProps> = ({ type, className, color = '#FFD1DC' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    const container = containerRef.current;

    // Safety: Clear any existing canvas to prevent duplication
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) return;

    const scene = new THREE.Scene();
    // Use a slightly narrower FOV or move camera back to prevent clipping large sprites
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();

    if (type === 'candle') {
      // Candle Body - Shifted down slightly to give more room for the flame aura
      const cylinder = new THREE.CylinderGeometry(0.22, 0.22, 0.85, 32);
      const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFDD0 });
      const candleBody = new THREE.Mesh(cylinder, bodyMaterial);
      candleBody.position.y = -0.2;
      
      // Intense Flame Core
      const flameGeometry = new THREE.SphereGeometry(0.09, 16, 16);
      const flameMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFFD700,
        emissive: 0xFF8C00,
        emissiveIntensity: 3.5
      });
      const flame = new THREE.Mesh(flameGeometry, flameMaterial);
      flame.position.y = 0.33;
      flame.scale.set(1, 2.2, 1);

      // Blurry Glow Halo - Refined scale and position to avoid clipping at the top
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255, 215, 50, 0.95)');
        gradient.addColorStop(0.3, 'rgba(255, 120, 0, 0.5)');
        gradient.addColorStop(0.6, 'rgba(255, 60, 0, 0.15)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
      }
      const glowTexture = new THREE.CanvasTexture(canvas);
      const glowMaterial = new THREE.SpriteMaterial({ 
        map: glowTexture, 
        transparent: true, 
        blending: THREE.AdditiveBlending,
        opacity: 0.85
      });
      const glowSprite = new THREE.Sprite(glowMaterial);
      glowSprite.position.y = 0.33;
      // Adjusted scale (smaller Y) to prevent sharp clipping edges
      glowSprite.scale.set(2.8, 3.8, 1);
      
      group.add(candleBody);
      group.add(flame);
      group.add(glowSprite);
      scene.add(group);

      const animateFlame = () => {
        const time = Date.now() * 0.001;
        // Sudden, high-frequency flickering jitter
        const jitter = Math.sin(time * 50) * 0.04 + (Math.random() - 0.5) * 0.1;
        const scaleBase = 2.2 + jitter;
        
        flame.scale.y = scaleBase;
        flame.position.x = Math.sin(time * 40) * 0.03;
        
        glowSprite.scale.y = scaleBase * 1.6;
        glowSprite.material.opacity = 0.7 + Math.random() * 0.3;
        glowSprite.position.x = flame.position.x;
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
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // Move camera back slightly to accommodate the large aura without clipping
    camera.position.z = 3.5;

    let requestRef: number;
    const animate = () => {
      requestRef = requestAnimationFrame(animate);
      group.rotation.y += 0.005;
      if ((group as any).update) (group as any).update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef);
      renderer.dispose();
      if (container && renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [type, color]);

  return <div ref={containerRef} className={className} />;
};
