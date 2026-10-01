import { useEffect, useRef } from "react";

const CELL = 10;
const LEVEL_STEP = 0.16;
const PARTICLE_COUNT = 70;
const PARTICLE_LIFETIME = 520;
const INK = "11, 11, 12";

interface PressureCenter {
  x: number;
  y: number;
  orbitX: number;
  orbitY: number;
  speed: number;
  phase: number;
  amplitude: number;
  spread: number;
}

interface Particle {
  x: number;
  y: number;
  age: number;
}

const CENTERS: PressureCenter[] = [
  { x: 0.16, y: 0.3, orbitX: 0.06, orbitY: 0.08, speed: 0.00011, phase: 0.0, amplitude: 1.25, spread: 0.2 },
  { x: 0.82, y: 0.24, orbitX: 0.07, orbitY: 0.06, speed: 0.00009, phase: 1.7, amplitude: -1.35, spread: 0.18 },
  { x: 0.62, y: 0.78, orbitX: 0.09, orbitY: 0.05, speed: 0.00013, phase: 3.1, amplitude: 1.05, spread: 0.16 },
  { x: 0.3, y: 0.86, orbitX: 0.05, orbitY: 0.06, speed: 0.0001, phase: 4.4, amplitude: -0.95, spread: 0.14 },
  { x: 0.95, y: 0.7, orbitX: 0.04, orbitY: 0.08, speed: 0.00012, phase: 2.2, amplitude: -0.8, spread: 0.13 },
  { x: 0.46, y: 0.12, orbitX: 0.08, orbitY: 0.04, speed: 0.00008, phase: 5.3, amplitude: 0.7, spread: 0.15 },
];

function centerPosition(center: PressureCenter, time: number, width: number, height: number) {
  const angle = time * center.speed + center.phase;
  return {
    x: (center.x + Math.cos(angle) * center.orbitX) * width,
    y: (center.y + Math.sin(angle * 1.3) * center.orbitY) * height,
  };
}

export function IsobarField({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, strength: 0, active: false };
    let width = 0;
    let height = 0;
    let columns = 0;
    let rows = 0;
    let grid = new Float32Array(0);
    let frame = 0;
    let visible = true;
    let particles: Particle[] = [];
    let positions: { x: number; y: number }[] = [];

    function spawn(age = 0): Particle {
      return { x: Math.random() * width, y: Math.random() * height, age };
    }

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      columns = Math.ceil(width / CELL) + 2;
      rows = Math.ceil(height / CELL) + 2;
      grid = new Float32Array(columns * rows);
      particles = Array.from({ length: PARTICLE_COUNT }, () => spawn(Math.random() * PARTICLE_LIFETIME));
    }

    function pressure(x: number, y: number, time: number) {
      const scale = Math.max(width, height);
      let value =
        (y / height) * 0.9 +
        Math.sin(x * 0.0031 + y * 0.0017 + time * 0.00007) * 0.22 +
        Math.sin(x * 0.0012 - y * 0.0041 - time * 0.00005) * 0.18;

      for (let index = 0; index < CENTERS.length; index++) {
        const center = CENTERS[index];
        const dx = x - positions[index].x;
        const dy = y - positions[index].y;
        const spread = center.spread * scale;
        value += center.amplitude * Math.exp(-(dx * dx + dy * dy) / (2 * spread * spread));
      }

      if (pointer.strength > 0.001) {
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        value -= 0.75 * pointer.strength * Math.exp(-(dx * dx + dy * dy) / (2 * 90 * 90));
      }
      return value;
    }

    function sampleGrid(time: number) {
      let min = Infinity;
      let max = -Infinity;
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const value = pressure((column - 1) * CELL, (row - 1) * CELL, time);
          grid[row * columns + column] = value;
          if (value < min) min = value;
          if (value > max) max = value;
        }
      }
      return { min, max };
    }

    function traceLevel(level: number) {
      const at = (a: number, b: number) => (level - a) / (b - a || 1e-6);
      for (let row = 0; row < rows - 1; row++) {
        for (let column = 0; column < columns - 1; column++) {
          const topLeft = grid[row * columns + column];
          const topRight = grid[row * columns + column + 1];
          const bottomRight = grid[(row + 1) * columns + column + 1];
          const bottomLeft = grid[(row + 1) * columns + column];
          const state =
            (topLeft >= level ? 8 : 0) |
            (topRight >= level ? 4 : 0) |
            (bottomRight >= level ? 2 : 0) |
            (bottomLeft >= level ? 1 : 0);
          if (state === 0 || state === 15) continue;

          const x = (column - 1) * CELL;
          const y = (row - 1) * CELL;
          const top = [x + CELL * at(topLeft, topRight), y];
          const right = [x + CELL, y + CELL * at(topRight, bottomRight)];
          const bottom = [x + CELL * at(bottomLeft, bottomRight), y + CELL];
          const left = [x, y + CELL * at(topLeft, bottomLeft)];

          const segments: number[][][] = [];
          switch (state) {
            case 1: case 14: segments.push([left, bottom]); break;
            case 2: case 13: segments.push([bottom, right]); break;
            case 3: case 12: segments.push([left, right]); break;
            case 4: case 11: segments.push([top, right]); break;
            case 6: case 9: segments.push([top, bottom]); break;
            case 7: case 8: segments.push([left, top]); break;
            case 5: segments.push([left, top], [bottom, right]); break;
            case 10: segments.push([top, right], [left, bottom]); break;
          }
          for (const [from, to] of segments) {
            context.moveTo(from[0], from[1]);
            context.lineTo(to[0], to[1]);
          }
        }
      }
    }

    function advect(particle: Particle, time: number) {
      const epsilon = 2;
      const gradientX = pressure(particle.x + epsilon, particle.y, time) - pressure(particle.x - epsilon, particle.y, time);
      const gradientY = pressure(particle.x, particle.y + epsilon, time) - pressure(particle.x, particle.y - epsilon, time);
      const magnitude = Math.hypot(gradientX, gradientY) || 1;
      const speed = Math.min(1.4, 0.35 + magnitude * 60);
      particle.x += (-gradientY / magnitude) * speed;
      particle.y += (gradientX / magnitude) * speed;
      particle.age += 1;
      const outside = particle.x < -10 || particle.x > width + 10 || particle.y < -10 || particle.y > height + 10;
      if (outside || particle.age > PARTICLE_LIFETIME) Object.assign(particle, spawn());
    }

    function draw(time: number) {
      pointer.x += (pointer.targetX - pointer.x) * 0.08;
      pointer.y += (pointer.targetY - pointer.y) * 0.08;
      pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * 0.05;
      positions = CENTERS.map((center) => centerPosition(center, time, width, height));

      context.globalCompositeOperation = "source-over";
      context.clearRect(0, 0, width, height);

      const { min, max } = sampleGrid(time);
      for (let step = Math.ceil(min / LEVEL_STEP); step <= Math.floor(max / LEVEL_STEP); step++) {
        const emphasis = step % 4 === 0;
        context.beginPath();
        traceLevel(step * LEVEL_STEP);
        context.strokeStyle = `rgba(${INK}, ${emphasis ? 0.3 : 0.13})`;
        context.lineWidth = emphasis ? 1.1 : 0.8;
        context.stroke();
      }

      context.fillStyle = `rgba(${INK}, 0.5)`;
      context.font = "600 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      context.textAlign = "center";
      context.textBaseline = "middle";
      CENTERS.forEach((center, index) => {
        context.fillText(center.amplitude > 0 ? "H" : "L", positions[index].x, positions[index].y);
      });

      for (const particle of particles) {
        if (!reducedMotion) advect(particle, time);
        context.globalAlpha = Math.max(0, Math.min(1, particle.age / 60, (PARTICLE_LIFETIME - particle.age) / 60));
        context.beginPath();
        context.arc(particle.x, particle.y, 1.4, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;

      context.globalCompositeOperation = "destination-out";
      const veil = context.createRadialGradient(0, 0, 0, 0, 0, 1);
      veil.addColorStop(0, "rgba(0, 0, 0, 0.9)");
      veil.addColorStop(0.55, "rgba(0, 0, 0, 0.5)");
      veil.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.save();
      context.translate(width / 2, height * 0.5);
      context.scale(Math.max(width * 0.4, 160), height * 0.34);
      context.fillStyle = veil;
      context.fillRect(-1, -1, 2, 2);
      context.restore();

      const edges = context.createLinearGradient(0, 0, 0, height);
      edges.addColorStop(0, "rgba(0, 0, 0, 1)");
      edges.addColorStop(0.1, "rgba(0, 0, 0, 0)");
      edges.addColorStop(0.85, "rgba(0, 0, 0, 0)");
      edges.addColorStop(1, "rgba(0, 0, 0, 1)");
      context.fillStyle = edges;
      context.fillRect(0, 0, width, height);
    }

    function loop(time: number) {
      draw(time);
      if (visible) frame = requestAnimationFrame(loop);
    }

    function onPointerMove(event: PointerEvent) {
      const bounds = canvas.getBoundingClientRect();
      pointer.targetX = event.clientX - bounds.left;
      pointer.targetY = event.clientY - bounds.top;
      if (!pointer.active) {
        pointer.x = pointer.targetX;
        pointer.y = pointer.targetY;
      }
      pointer.active = pointer.targetY >= 0 && pointer.targetY <= height;
    }

    function onPointerLeave() {
      pointer.active = false;
    }

    resize();
    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reducedMotion) draw(0);
    });
    resizeObserver.observe(canvas);

    if (reducedMotion) {
      draw(0);
      return () => resizeObserver.disconnect();
    }

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(frame);
      if (visible) frame = requestAnimationFrame(loop);
    });
    intersectionObserver.observe(canvas);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`block w-full h-full ${className}`} />;
}
