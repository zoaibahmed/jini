'use client';

import React, { useRef, useEffect } from 'react';

interface AntigravityItemProps {
  children: React.ReactNode;
  className?: string;
  repulsionStrength?: number; // scale multiplier for mouse push
  driftScale?: number;        // scale of natural zero-g drift
  springStrength?: number;    // how fast it returns to home position
  maxOffset?: number;         // safety boundary in pixels
}

export function AntigravityItem({
  children,
  className = '',
  repulsionStrength = 2.2,
  driftScale = 0.4,
  springStrength = 0.025,
  maxOffset = 80,
}: AntigravityItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let x = 0;
    let y = 0;
    let vx = 0;
    let vy = 0;
    let angle = Math.random() * Math.PI * 2;
    let animationFrameId: number;

    const mouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const tick = () => {
      // 1. Natural slow zero-g drift (sine/cosine waves)
      angle += 0.012;
      const driftX = Math.cos(angle) * driftScale;
      const driftY = Math.sin(angle * 1.3) * driftScale;
      
      vx += driftX * 0.06;
      vy += driftY * 0.06;

      // 2. Mouse repulsion physics
      if (mouse.x !== -1000 && el) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = mouse.x - centerX;
        const dy = mouse.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const radius = 200; // interaction radius
        if (dist < radius) {
          const force = (radius - dist) / radius; // 0 to 1
          const forceAngle = Math.atan2(dy, dx);
          
          // Repel item away from cursor
          vx -= Math.cos(forceAngle) * force * repulsionStrength;
          vy -= Math.sin(forceAngle) * force * repulsionStrength;
        }
      }

      // 3. Gentle spring back to origin
      const springForceX = -x * springStrength;
      const springForceY = -y * springStrength;
      
      vx += springForceX;
      vy += springForceY;

      // 4. Friction/damping
      vx *= 0.90;
      vy *= 0.90;

      // 5. Update positions
      x += vx;
      y += vy;

      // 6. Max offset boundaries
      const totalDist = Math.sqrt(x * x + y * y);
      if (totalDist > maxOffset) {
        x = (x / totalDist) * maxOffset;
        y = (y / totalDist) * maxOffset;
        vx = 0;
        vy = 0;
      }

      // Apply transform via DOM directly for high performance (60fps)
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [repulsionStrength, driftScale, springStrength, maxOffset]);

  return (
    <div 
      ref={ref} 
      className={`will-change-transform transition-shadow duration-300 ${className}`}
      style={{ display: 'block', width: '100%' }}
    >
      {children}
    </div>
  );
}
