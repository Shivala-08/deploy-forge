"use client";

import React, { useEffect, useRef, useState } from "react";

export type PhysicsMode = "standard" | "antigravity" | "gravity";

interface PhysicsBody {
  element: HTMLElement;
  // Static initial positions (offset relative to wrapper)
  x0: number;
  y0: number;
  // Current positions
  x: number;
  y: number;
  // Current velocities
  vx: number;
  vy: number;
  // Dimensions
  width: number;
  height: number;
  // Rotation (radians) and angular velocity
  angle: number;
  vangle: number;
  // Mass for collision and gravity calculations
  mass: number;
}

interface AntigravityPlaygroundProps {
  children: React.ReactNode;
  mode: PhysicsMode;
  className?: string;
}

export function AntigravityPlayground({
  children,
  mode,
  className = "",
}: AntigravityPlaygroundProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bodiesRef = useRef<PhysicsBody[]>([]);
  const requestRef = useRef<number | null>(null);
  
  // Drag state
  const draggedBodyRef = useRef<PhysicsBody | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const mousePosRef = useRef({ x: 0, y: 0 });
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Handle initialization of physics bodies
  useEffect(() => {
    if (!wrapperRef.current) return;

    if (mode === "standard") {
      // Cancel loop and reset all elements back to standard layout
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      
      bodiesRef.current.forEach((body) => {
        body.element.style.transform = "";
        body.element.style.transition = "transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)";
        body.element.style.cursor = "";
      });
      bodiesRef.current = [];
      return;
    }

    // Initialize physics bodies
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const elements = wrapperRef.current.querySelectorAll("[data-antigravity]");
    const bodies: PhysicsBody[] = [];

    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const rect = htmlEl.getBoundingClientRect();
      
      // Calculate position relative to the wrapper
      const x0 = rect.left - wrapperRect.left;
      const y0 = rect.top - wrapperRect.top;

      // Clear any transition that would conflict with frame-by-frame physics updates
      htmlEl.style.transition = "none";
      htmlEl.style.cursor = "grab";

      bodies.push({
        element: htmlEl,
        x0,
        y0,
        x: x0,
        y: y0,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5 - (mode === "gravity" ? 2 : 0),
        width: rect.width,
        height: rect.height,
        angle: 0,
        vangle: (Math.random() - 0.5) * 0.02,
        mass: (rect.width * rect.height) / 1000,
      });
    });

    bodiesRef.current = bodies;

    // Physics constants
    const gravity = mode === "gravity" ? 0.35 : 0;
    const friction = 0.985;
    const boundaryRestitution = 0.65; // bounce factor

    const updatePhysics = () => {
      if (!wrapperRef.current) return;
      
      const wrapperWidth = wrapperRef.current.clientWidth;
      const wrapperHeight = wrapperRef.current.clientHeight;

      // Calculate dragged item instantaneous velocity
      if (draggedBodyRef.current) {
        const body = draggedBodyRef.current;
        const targetX = mousePosRef.current.x - dragOffsetRef.current.x;
        const targetY = mousePosRef.current.y - dragOffsetRef.current.y;
        
        // Soft lock to mouse position
        body.vx = (targetX - body.x) * 0.4;
        body.vy = (targetY - body.y) * 0.4;
        
        body.x = targetX;
        body.y = targetY;
        
        // Spin while dragging based on speed
        body.vangle = body.vx * 0.005;
        body.angle += body.vangle;
      }

      bodiesRef.current.forEach((body) => {
        if (body === draggedBodyRef.current) {
          // Render updates for dragged element
          const dx = body.x - body.x0;
          const dy = body.y - body.y0;
          body.element.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${body.angle}rad)`;
          return;
        }

        // Apply Gravity
        body.vy += gravity;

        // Apply Drift (noise) in antigravity mode
        if (mode === "antigravity") {
          body.vx += (Math.random() - 0.5) * 0.08;
          body.vy += (Math.random() - 0.5) * 0.08;
        }

        // Apply mouse repulsion force
        const bodyCenterX = body.x + body.width / 2;
        const bodyCenterY = body.y + body.height / 2;
        const dxToMouse = bodyCenterX - mousePosRef.current.x;
        const dyToMouse = bodyCenterY - mousePosRef.current.y;
        const distanceToMouse = Math.sqrt(dxToMouse * dxToMouse + dyToMouse * dyToMouse);
        
        if (distanceToMouse < 220 && distanceToMouse > 5) {
          const force = (220 - distanceToMouse) * 0.008;
          body.vx += (dxToMouse / distanceToMouse) * force;
          body.vy += (dyToMouse / distanceToMouse) * force;
        }

        // Apply friction
        body.vx *= friction;
        body.vy *= friction;
        body.vangle *= 0.96;

        // Update Position & Angle
        body.x += body.vx;
        body.y += body.vy;
        body.angle += body.vangle;

        // Edge Collision Checks
        // Right
        if (body.x + body.width > wrapperWidth) {
          body.x = wrapperWidth - body.width;
          body.vx = -Math.abs(body.vx) * boundaryRestitution;
          body.vangle += body.vy * 0.02; // transfer linear velocity to torque
        }
        // Left
        else if (body.x < 0) {
          body.x = 0;
          body.vx = Math.abs(body.vx) * boundaryRestitution;
          body.vangle -= body.vy * 0.02;
        }

        // Bottom
        if (body.y + body.height > wrapperHeight) {
          body.y = wrapperHeight - body.height;
          body.vy = -Math.abs(body.vy) * boundaryRestitution;
          body.vangle -= body.vx * 0.02;
        }
        // Top
        else if (body.y < 0) {
          body.y = 0;
          body.vy = Math.abs(body.vy) * boundaryRestitution;
          body.vangle += body.vx * 0.02;
        }

        // Apply Style Transforms
        const dx = body.x - body.x0;
        const dy = body.y - body.y0;
        body.element.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${body.angle}rad)`;
      });

      requestRef.current = requestAnimationFrame(updatePhysics);
    };

    requestRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [mode]);

  // Pointer Event Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (mode === "standard") return;
    
    // Find if we clicked a node with data-antigravity
    const target = e.target as HTMLElement;
    const interactiveEl = target.closest("[data-antigravity]") as HTMLElement;
    
    if (!interactiveEl || !wrapperRef.current) return;

    const body = bodiesRef.current.find((b) => b.element === interactiveEl);
    if (!body) return;

    // Activate drag
    draggedBodyRef.current = body;
    interactiveEl.style.cursor = "grabbing";
    
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const cursorX = e.clientX - wrapperRect.left;
    const cursorY = e.clientY - wrapperRect.top;

    // Offset of click relative to the physics body top-left
    dragOffsetRef.current = {
      x: cursorX - body.x,
      y: cursorY - body.y,
    };
    
    // Store current mouse coordinates
    mousePosRef.current = { x: cursorX, y: cursorY };
    lastMousePosRef.current = { x: cursorX, y: cursorY };

    // Prevent text selection during drag
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!wrapperRef.current) return;
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const cursorX = e.clientX - wrapperRect.left;
    const cursorY = e.clientY - wrapperRect.top;
    
    mousePosRef.current = { x: cursorX, y: cursorY };
  };

  const handlePointerUp = () => {
    if (draggedBodyRef.current) {
      draggedBodyRef.current.element.style.cursor = "grab";
      draggedBodyRef.current = null;
    }
  };

  return (
    <div
      ref={wrapperRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={`relative w-full min-h-screen ${className}`}
      style={{ touchAction: "none" }}
    >
      {children}
    </div>
  );
}
