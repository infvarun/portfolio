import React, { useRef, useEffect, useCallback, useState } from 'react';

// ── Constants ──────────────────────────────────────────────────────────
const NODE_W = 220;
const NODE_H = 72;
const NODE_R = 14;
const PORT_R = 5;
const ICON_BOX = 36;
const ICON_R = 8;
const GRID_DOT = 30;
const GRID_LINE = 150;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;

// ── Types ──────────────────────────────────────────────────────────────
export interface CanvasNode {
  id: string;
  type: string;
  title: string;
  position: { x: number; y: number };
  color: string;
}

export interface CanvasConnection {
  from: string;
  to: string;
}

interface Camera {
  x: number;
  y: number;
  zoom: number;
}

interface DragState {
  nodeId: string;
  startX: number;
  startY: number;
  nodeStartX: number;
  nodeStartY: number;
}

interface PanState {
  startX: number;
  startY: number;
  camStartX: number;
  camStartY: number;
}

interface Props {
  nodes: CanvasNode[];
  connections: CanvasConnection[];
  selectedNodeId: string | null;
  onNodeClick: (id: string) => void;
  onNodeDrag: (id: string, pos: { x: number; y: number }) => void;
  onCanvasClick: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────
function screenToWorld(sx: number, sy: number, cam: Camera) {
  return { x: (sx - cam.x) / cam.zoom, y: (sy - cam.y) / cam.zoom };
}

function hitNode(wx: number, wy: number, n: CanvasNode) {
  return wx >= n.position.x && wx <= n.position.x + NODE_W &&
         wy >= n.position.y && wy <= n.position.y + NODE_H;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function hexToRgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ── Icon Drawing ───────────────────────────────────────────────────────
function drawIcon(ctx: CanvasRenderingContext2D, type: string, cx: number, cy: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const s = 8; // half-size

  switch (type) {
    case 'profile': {
      // Person silhouette
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.35, s * 0.42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy + s * 0.9, s * 0.7, Math.PI, 0);
      ctx.stroke();
      break;
    }
    case 'experience': {
      // Briefcase
      const bw = s * 1.4, bh = s * 1.0;
      roundRect(ctx, cx - bw / 2, cy - bh / 2 + 1, bw, bh, 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.3, cy - bh / 2 + 1);
      ctx.lineTo(cx - s * 0.3, cy - bh / 2 - 2);
      ctx.quadraticCurveTo(cx - s * 0.3, cy - bh / 2 - 4, cx - s * 0.1, cy - bh / 2 - 4);
      ctx.lineTo(cx + s * 0.1, cy - bh / 2 - 4);
      ctx.quadraticCurveTo(cx + s * 0.3, cy - bh / 2 - 4, cx + s * 0.3, cy - bh / 2 - 2);
      ctx.lineTo(cx + s * 0.3, cy - bh / 2 + 1);
      ctx.stroke();
      break;
    }
    case 'skills': {
      // Code brackets: < />
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.3, cy - s * 0.5);
      ctx.lineTo(cx - s * 0.8, cy);
      ctx.lineTo(cx - s * 0.3, cy + s * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.3, cy - s * 0.5);
      ctx.lineTo(cx + s * 0.8, cy);
      ctx.lineTo(cx + s * 0.3, cy + s * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.12, cy - s * 0.6);
      ctx.lineTo(cx - s * 0.12, cy + s * 0.6);
      ctx.stroke();
      break;
    }
    case 'projects': {
      // Folder
      ctx.beginPath();
      const fw = s * 1.4, fh = s * 1.0;
      const fx = cx - fw / 2, fy = cy - fh / 2 + 1;
      roundRect(ctx, fx, fy, fw, fh, 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(fx, fy + 3);
      ctx.lineTo(fx, fy - 2);
      ctx.quadraticCurveTo(fx, fy - 4, fx + 2, fy - 4);
      ctx.lineTo(fx + fw * 0.35, fy - 4);
      ctx.lineTo(fx + fw * 0.45, fy);
      ctx.stroke();
      break;
    }
    case 'awards': {
      // Star
      const pts = 5, outer = s * 0.7, inner = s * 0.3;
      ctx.beginPath();
      for (let i = 0; i < pts * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const angle = (i * Math.PI) / pts - Math.PI / 2;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'education': {
      // Graduation cap
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.8, cy);
      ctx.lineTo(cx, cy - s * 0.5);
      ctx.lineTo(cx + s * 0.8, cy);
      ctx.lineTo(cx, cy + s * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.5, cy + s * 0.05);
      ctx.lineTo(cx - s * 0.5, cy + s * 0.5);
      ctx.quadraticCurveTo(cx, cy + s * 0.8, cx + s * 0.5, cy + s * 0.5);
      ctx.lineTo(cx + s * 0.5, cy + s * 0.05);
      ctx.stroke();
      break;
    }
    case 'database': {
      // Database cylinder
      const dw = s * 0.7, dh = s * 0.9;
      ctx.beginPath();
      ctx.ellipse(cx, cy - dh, dw, s * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - dw, cy - dh);
      ctx.lineTo(cx - dw, cy + dh * 0.5);
      ctx.ellipse(cx, cy + dh * 0.5, dw, s * 0.3, 0, Math.PI, 0, true);
      ctx.lineTo(cx + dw, cy - dh);
      ctx.stroke();
      break;
    }
    case 'system': {
      // Terminal >_
      roundRect(ctx, cx - s * 0.8, cy - s * 0.6, s * 1.6, s * 1.2, 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.4, cy - s * 0.15);
      ctx.lineTo(cx - s * 0.1, cy + s * 0.1);
      ctx.lineTo(cx - s * 0.4, cy + s * 0.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.05, cy + s * 0.35);
      ctx.lineTo(cx + s * 0.45, cy + s * 0.35);
      ctx.stroke();
      break;
    }
    case 'contact': {
      // Message bubble
      roundRect(ctx, cx - s * 0.8, cy - s * 0.5, s * 1.6, s * 1.0, 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.3, cy + s * 0.5);
      ctx.lineTo(cx - s * 0.5, cy + s * 0.85);
      ctx.lineTo(cx, cy + s * 0.5);
      ctx.stroke();
      break;
    }
    default: {
      // Fallback circle
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ── Canvas Drawing ─────────────────────────────────────────────────────
function drawGrid(ctx: CanvasRenderingContext2D, cam: Camera, cw: number, ch: number) {
  ctx.save();

  // Compute visible world bounds
  const tl = screenToWorld(0, 0, cam);
  const br = screenToWorld(cw, ch, cam);

  // Dot grid
  const dotStart = {
    x: Math.floor(tl.x / GRID_DOT) * GRID_DOT,
    y: Math.floor(tl.y / GRID_DOT) * GRID_DOT,
  };
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let x = dotStart.x; x <= br.x; x += GRID_DOT) {
    for (let y = dotStart.y; y <= br.y; y += GRID_DOT) {
      const sx = x * cam.zoom + cam.x;
      const sy = y * cam.zoom + cam.y;
      ctx.fillRect(sx - 0.5, sy - 0.5, 1, 1);
    }
  }

  // Line grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  const lineStart = {
    x: Math.floor(tl.x / GRID_LINE) * GRID_LINE,
    y: Math.floor(tl.y / GRID_LINE) * GRID_LINE,
  };
  for (let x = lineStart.x; x <= br.x; x += GRID_LINE) {
    const sx = x * cam.zoom + cam.x;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, ch);
    ctx.stroke();
  }
  for (let y = lineStart.y; y <= br.y; y += GRID_LINE) {
    const sy = y * cam.zoom + cam.y;
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(cw, sy);
    ctx.stroke();
  }

  ctx.restore();
}

function drawConnection(
  ctx: CanvasRenderingContext2D,
  fromNode: CanvasNode,
  toNode: CanvasNode,
  time: number,
) {
  const x1 = fromNode.position.x + NODE_W;
  const y1 = fromNode.position.y + NODE_H / 2;
  const x2 = toNode.position.x;
  const y2 = toNode.position.y + NODE_H / 2;

  const dx = x2 - x1;
  const cpOff = Math.max(Math.abs(dx) * 0.5, 60);

  // Base line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.bezierCurveTo(x1 + cpOff, y1, x2 - cpOff, y2, x2, y2);
  ctx.strokeStyle = 'rgba(63,63,70,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Animated dash
  ctx.save();
  ctx.setLineDash([6, 10]);
  ctx.lineDashOffset = -time * 0.03;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.bezierCurveTo(x1 + cpOff, y1, x2 - cpOff, y2, x2, y2);
  ctx.strokeStyle = hexToRgba(fromNode.color, 0.45);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  node: CanvasNode,
  isSelected: boolean,
  isHovered: boolean,
  _time: number,
) {
  const { x, y } = node.position;

  // Selection glow
  if (isSelected) {
    ctx.save();
    ctx.shadowColor = node.color;
    ctx.shadowBlur = 24;
    roundRect(ctx, x - 1, y - 1, NODE_W + 2, NODE_H + 2, NODE_R + 1);
    ctx.strokeStyle = hexToRgba(node.color, 0.6);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // Background
  roundRect(ctx, x, y, NODE_W, NODE_H, NODE_R);
  ctx.fillStyle = isHovered ? 'rgba(30,30,35,0.95)' : 'rgba(24,24,27,0.92)';
  ctx.fill();
  ctx.strokeStyle = isSelected ? hexToRgba(node.color, 0.7) : isHovered ? 'rgba(82,82,91,0.8)' : 'rgba(55,55,63,0.7)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Icon box
  const ix = x + 14;
  const iy = y + (NODE_H - ICON_BOX) / 2;
  roundRect(ctx, ix, iy, ICON_BOX, ICON_BOX, ICON_R);
  ctx.fillStyle = hexToRgba(node.color, 0.12);
  ctx.fill();

  // Icon
  drawIcon(ctx, node.type, ix + ICON_BOX / 2, iy + ICON_BOX / 2, node.color);

  // Type label
  const textX = ix + ICON_BOX + 12;
  ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(161,161,170,0.7)';
  ctx.textBaseline = 'middle';
  ctx.fillText(node.type.toUpperCase(), textX, y + NODE_H / 2 - 10);

  // Title
  ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(228,228,231,1)';
  // Truncate title
  let title = node.title;
  const maxW = NODE_W - (textX - x) - 16;
  while (ctx.measureText(title).width > maxW && title.length > 3) {
    title = title.slice(0, -1);
  }
  if (title !== node.title) title += '…';
  ctx.fillText(title, textX, y + NODE_H / 2 + 9);

  // Left port
  ctx.beginPath();
  ctx.arc(x, y + NODE_H / 2, PORT_R, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(55,55,63,1)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(24,24,27,1)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Right port
  ctx.beginPath();
  ctx.arc(x + NODE_W, y + NODE_H / 2, PORT_R, 0, Math.PI * 2);
  ctx.fillStyle = isSelected || isHovered ? node.color : 'rgba(55,55,63,1)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(24,24,27,1)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ── Component ──────────────────────────────────────────────────────────
export default function WorkflowCanvas({
  nodes,
  connections,
  selectedNodeId,
  onNodeClick,
  onNodeDrag,
  onCanvasClick,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const dragRef = useRef<DragState | null>(null);
  const panRef = useRef<PanState | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const timeRef = useRef(0);
  const animRef = useRef(0);
  const didDragRef = useRef(false);
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  // Center camera on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;
    const xs = nodes.map(n => n.position.x);
    const ys = nodes.map(n => n.position.y);
    const cx = (Math.min(...xs) + Math.max(...xs) + NODE_W) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys) + NODE_H) / 2;
    setCamera({
      x: canvas.clientWidth / 2 - cx,
      y: canvas.clientHeight / 2 - cy,
      zoom: 1,
    });
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    const loop = () => {
      if (!running) return;
      timeRef.current += 1;

      const dpr = window.devicePixelRatio || 1;
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;

      if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
        canvas.width = cw * dpr;
        canvas.height = ch * dpr;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);

      // Fill background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, cw, ch);

      const cam = cameraRef.current;
      const curNodes = nodesRef.current;

      // Grid
      drawGrid(ctx, cam, cw, ch);

      // Apply camera transform for world-space drawing
      ctx.save();
      ctx.translate(cam.x, cam.y);
      ctx.scale(cam.zoom, cam.zoom);

      // Connections
      for (const conn of connections) {
        const fromNode = curNodes.find(n => n.id === conn.from);
        const toNode = curNodes.find(n => n.id === conn.to);
        if (fromNode && toNode) {
          drawConnection(ctx, fromNode, toNode, timeRef.current);
        }
      }

      // Nodes
      for (const node of curNodes) {
        const isSel = node.id === selectedNodeId;
        const isHov = node.id === hoveredRef.current;
        drawNode(ctx, node, isSel, isHov, timeRef.current);
      }

      ctx.restore();

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [connections, selectedNodeId]);

  // Mouse handlers
  const getMousePos = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { mx: e.clientX - rect.left, my: e.clientY - rect.top };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const { mx, my } = getMousePos(e);
    const cam = cameraRef.current;
    const world = screenToWorld(mx, my, cam);
    didDragRef.current = false;

    // Check nodes in reverse order (top-most first)
    const curNodes = nodesRef.current;
    for (let i = curNodes.length - 1; i >= 0; i--) {
      const n = curNodes[i];
      if (hitNode(world.x, world.y, n)) {
        dragRef.current = {
          nodeId: n.id,
          startX: mx,
          startY: my,
          nodeStartX: n.position.x,
          nodeStartY: n.position.y,
        };
        return;
      }
    }

    // Pan
    panRef.current = {
      startX: mx,
      startY: my,
      camStartX: cam.x,
      camStartY: cam.y,
    };
  }, [getMousePos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { mx, my } = getMousePos(e);
    const cam = cameraRef.current;

    if (dragRef.current) {
      const d = dragRef.current;
      const dx = (mx - d.startX) / cam.zoom;
      const dy = (my - d.startY) / cam.zoom;
      if (Math.abs(mx - d.startX) > 3 || Math.abs(my - d.startY) > 3) {
        didDragRef.current = true;
      }
      onNodeDrag(d.nodeId, {
        x: d.nodeStartX + dx,
        y: d.nodeStartY + dy,
      });
      return;
    }

    if (panRef.current) {
      const p = panRef.current;
      if (Math.abs(mx - p.startX) > 3 || Math.abs(my - p.startY) > 3) {
        didDragRef.current = true;
      }
      setCamera(prev => ({
        ...prev,
        x: p.camStartX + (mx - p.startX),
        y: p.camStartY + (my - p.startY),
      }));
      return;
    }

    // Hover detection
    const world = screenToWorld(mx, my, cam);
    const curNodes = nodesRef.current;
    let found: string | null = null;
    for (let i = curNodes.length - 1; i >= 0; i--) {
      if (hitNode(world.x, world.y, curNodes[i])) {
        found = curNodes[i].id;
        break;
      }
    }
    hoveredRef.current = found;

    // Cursor
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = found ? 'grab' : 'default';
    }
  }, [getMousePos, onNodeDrag]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (dragRef.current && !didDragRef.current) {
      onNodeClick(dragRef.current.nodeId);
    } else if (panRef.current && !didDragRef.current) {
      onCanvasClick();
    }
    dragRef.current = null;
    panRef.current = null;
  }, [onNodeClick, onCanvasClick]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const { mx, my } = getMousePos(e);
    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;

    setCamera(prev => {
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom * factor));
      const ratio = newZoom / prev.zoom;
      return {
        x: mx - (mx - prev.x) * ratio,
        y: my - (my - prev.y) * ratio,
        zoom: newZoom,
      };
    });
  }, [getMousePos]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      // Canvas sizing is handled in the animation loop via clientWidth/clientHeight
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    />
  );
}
