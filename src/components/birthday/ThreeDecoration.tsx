
"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'theme'; // Note: Ensure 'three' is imported correctly based on environment

// Workaround for potential import issues in some environments, ensuring THREE is available
import * as THREE_LIB from 'three';
const THREE_NS = (window as any).THREE || THREE_LIB;

interface ThreeDecorationProps {
  type: 'heart' | 'star' | 'cube' | 'butterfly' | 'candle';
  className?: string;
  color?: string;
}

export const ThreeDecoration: React.FC<ThreeDecorationProps> = ({ type, className, color = '#FFD1DC' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Safety: Clear any existing canvas to prevent duplication
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE_NS.Scene();
    const camera = new THREE_NS.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE_NS.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    let group = new THREE_NS.Group();

    if (type === 'candle') {
      // Candle Body (Creamy ivory color)
      const cylinder = new THREE_NS.CylinderGeometry(0.2, 0.2, 0.8, 32);
      const bodyMaterial = new THREE_NS.MeshPhongMaterial({ color: 0xFFFDD0 });
      const candleBody = new THREE_NS.Mesh(cylinder, bodyMaterial);
      
      // Intense Flame Core (Bright orange-gold)
      const flameGeometry = new THREE_NS.SphereGeometry(0.08, 16, 16);
      const flameMaterial = new THREE_NS.MeshPhongMaterial({ 
        color: 0xFFD700,
        emissive: 0xFF8C00,
        emissiveIntensity: 3
      });
      const flame = new THREE_NS.Mesh(flameGeometry, flameMaterial);
      flame.position.y = 0.5;
      flame.scale.set(1, 2, 1);

      // Blurry Glow Halo
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 200, 50, 0.9)');
        gradient.addColorStop(0.4, 'rgba(255, 100, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
      }
      const glowTexture = new THREE_NS.CanvasTexture(canvas);
      const glowMaterial = new THREE_NS.SpriteMaterial({ 
        map: glowTexture, 
        transparent: true, 
        blending: THREE_NS.AdditiveBlending,
        opacity: 0.8
      });
      const glowSprite = new THREE_NS.Sprite(glowMaterial);
      glowSprite.position.y = 0.55;
      glowSprite.scale.set(1.8, 3, 1);
      
      group.add(candleBody);
      group.add(flame);
      group.add(glowSprite);
      scene.add(group);

      const animateFlame = () => {
        const time = Date.now() * 0.001;
        // Sudden, high-frequency flickering jitter
        const jitter = Math.sin(time * 45) * 0.03 + (Math.random() - 0.5) * 0.08;
        const scaleBase = 2 + jitter;
        
        flame.scale.y = scaleBase;
        flame.position.x = Math.sin(time * 35) * 0.025;
        
        glowSprite.scale.y = scaleBase * 1.6;
        glowSprite.material.opacity = 0.6 + Math.random() * 0.4;
        glowSprite.position.x = flame.position.x;
      };
      (group as any).update = animateFlame;
    } else if (type === 'heart') {
      const heartShape = new THREE_NS.Shape();
      heartShape.moveTo(0, 0);
      heartShape.bezierCurveTo(0, 0, -2, 2, -5, 2);
      heartShape.bezierCurveTo(-10, 2, -10, -5, -10, -5);
      heartShape.bezierCurveTo(-10, -10, -5, -15, 0, -20);
      heartShape.bezierCurveTo(5, -15, 10, -10, 10, -5);
      heartShape.bezierCurveTo(10, -5, 10, 2, 5, 2);
      heartShape.bezierCurveTo(2, 2, 0, 0, 0, 0);
      const geometry = new THREE_NS.ExtrudeGeometry(heartShape, { depth: 2, bevelEnabled: true });
      const material = new THREE_NS.MeshPhongMaterial({ color: new THREE_NS.Color(color) });
      const mesh = new THREE_NS.Mesh(geometry, material);
      mesh.scale.set(0.03, 0.03, 0.03);
      mesh.rotation.x = Math.PI;
      group.add(mesh);
      scene.add(group);
    }

    const light = new THREE_NS.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 2);
    scene.add(light);
    scene.add(new THREE_NS.AmbientLight(0xffffff, 0.4));

    camera.position.z = 2.5;

    let requestRef: number;
    const animate = () => {
      requestRef = requestAnimationFrame(animate);
      group.rotation.y += 0.005;
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
      cancelAnimationFrame(requestRef);
      renderer.dispose();
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [type, color]);

  return <div ref={containerRef} className={className} />;
};
