import React, { useCallback, useRef, useState } from 'react';
import { useReactFlow, useStore } from 'reactflow';

// Utility function to check if two line segments intersect
function segmentsIntersect(p1, p2, p3, p4) {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  if (d1 === 0 && onSegment(p3, p4, p1)) return true;
  if (d2 === 0 && onSegment(p3, p4, p2)) return true;
  if (d3 === 0 && onSegment(p1, p2, p3)) return true;
  if (d4 === 0 && onSegment(p1, p2, p4)) return true;

  return false;
}

function direction(pi, pj, pk) {
  return (pk.x - pi.x) * (pj.y - pi.y) - (pj.x - pi.x) * (pk.y - pi.y);
}

function onSegment(pi, pj, pk) {
  return (
    Math.min(pi.x, pj.x) <= pk.x &&
    pk.x <= Math.max(pi.x, pj.x) &&
    Math.min(pi.y, pj.y) <= pk.y &&
    pk.y <= Math.max(pi.y, pj.y)
  );
}

// Check if a point is inside a rectangle
function pointInRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

// Check if a line segment intersects with a rectangle
function lineIntersectsRect(p1, p2, rect) {
  // Check if either endpoint is inside the rectangle
  if (pointInRect(p1, rect) || pointInRect(p2, rect)) {
    return true;
  }

  // Check intersection with each edge of the rectangle
  const topLeft = { x: rect.x, y: rect.y };
  const topRight = { x: rect.x + rect.width, y: rect.y };
  const bottomLeft = { x: rect.x, y: rect.y + rect.height };
  const bottomRight = { x: rect.x + rect.width, y: rect.y + rect.height };

  return (
    segmentsIntersect(p1, p2, topLeft, topRight) ||
    segmentsIntersect(p1, p2, topRight, bottomRight) ||
    segmentsIntersect(p1, p2, bottomRight, bottomLeft) ||
    segmentsIntersect(p1, p2, bottomLeft, topLeft)
  );
}

const Eraser = ({ onErase }) => {
  const { screenToFlowPosition, getNodes, getEdges, deleteElements } = useReactFlow();
  const [trail, setTrail] = useState([]);
  const [isErasing, setIsErasing] = useState(false);
  const erasedIds = useRef(new Set());
  
  const transform = useStore((state) => state.transform);

  const handlePointerDown = useCallback((event) => {
    if (event.button !== 0) return; // Only left mouse button
    
    setIsErasing(true);
    erasedIds.current = new Set();
    
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    
    setTrail([position]);
  }, [screenToFlowPosition]);

  const handlePointerMove = useCallback((event) => {
    if (!isErasing) return;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    setTrail((prev) => {
      const newTrail = [...prev, position];
      
      // Check intersections with nodes
      const nodes = getNodes();
      const nodesToDelete = [];
      
      for (const node of nodes) {
        if (erasedIds.current.has(node.id)) continue;
        
        const nodeRect = {
          x: node.position.x,
          y: node.position.y,
          width: node.width || node.measured?.width || 150,
          height: node.height || node.measured?.height || 40,
        };

        // Check if the last segment of the trail intersects with the node
        if (newTrail.length >= 2) {
          const lastPoint = newTrail[newTrail.length - 1];
          const prevPoint = newTrail[newTrail.length - 2];
          
          if (lineIntersectsRect(prevPoint, lastPoint, nodeRect)) {
            nodesToDelete.push({ id: node.id });
            erasedIds.current.add(node.id);
          }
        }
      }

      // Check intersections with edges
      const edges = getEdges();
      const edgesToDelete = [];
      
      for (const edge of edges) {
        if (erasedIds.current.has(edge.id)) continue;
        
        // Get the edge path element
        const edgePath = document.querySelector(`[data-testid="rf__edge-${edge.id}"] path`);
        if (!edgePath) continue;

        // Sample points along the edge
        const pathLength = edgePath.getTotalLength();
        const sampleDistance = 10;
        const samples = Math.ceil(pathLength / sampleDistance);
        
        let intersects = false;
        
        if (newTrail.length >= 2) {
          const lastPoint = newTrail[newTrail.length - 1];
          const prevPoint = newTrail[newTrail.length - 2];
          
          for (let i = 0; i < samples && !intersects; i++) {
            const point1 = edgePath.getPointAtLength(i * sampleDistance);
            const point2 = edgePath.getPointAtLength(Math.min((i + 1) * sampleDistance, pathLength));
            
            if (segmentsIntersect(
              prevPoint, 
              lastPoint, 
              { x: point1.x, y: point1.y }, 
              { x: point2.x, y: point2.y }
            )) {
              intersects = true;
            }
          }
        }

        if (intersects) {
          edgesToDelete.push({ id: edge.id });
          erasedIds.current.add(edge.id);
        }
      }

      // Delete elements that were erased
      if (nodesToDelete.length > 0 || edgesToDelete.length > 0) {
        deleteElements({ nodes: nodesToDelete, edges: edgesToDelete });
        if (onErase) {
          onErase({ nodes: nodesToDelete, edges: edgesToDelete });
        }
      }

      return newTrail;
    });
  }, [isErasing, screenToFlowPosition, getNodes, getEdges, deleteElements, onErase]);

  const handlePointerUp = useCallback(() => {
    setIsErasing(false);
    setTrail([]);
    erasedIds.current = new Set();
  }, []);

  // Convert trail to screen coordinates for SVG rendering
  const screenTrail = trail.map((point) => ({
    x: point.x * transform[2] + transform[0],
    y: point.y * transform[2] + transform[1],
  }));

  // Create ultra-smooth path using Catmull-Rom to Bezier conversion
  const createSmoothPath = (points) => {
    if (points.length < 2) return '';
    if (points.length === 2) {
      return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }

    // Reduce points by averaging nearby points for smoother result
    const smoothedPoints = [];
    const smoothingWindow = 3;
    
    for (let i = 0; i < points.length; i++) {
      let sumX = 0, sumY = 0, count = 0;
      for (let j = Math.max(0, i - smoothingWindow); j <= Math.min(points.length - 1, i + smoothingWindow); j++) {
        sumX += points[j].x;
        sumY += points[j].y;
        count++;
      }
      smoothedPoints.push({ x: sumX / count, y: sumY / count });
    }

    // Skip every other point to reduce density
    const reducedPoints = smoothedPoints.filter((_, i) => i % 2 === 0 || i === smoothedPoints.length - 1);
    
    if (reducedPoints.length < 2) return '';
    if (reducedPoints.length === 2) {
      return `M ${reducedPoints[0].x} ${reducedPoints[0].y} L ${reducedPoints[1].x} ${reducedPoints[1].y}`;
    }

    // Create smooth curve through midpoints
    let path = `M ${reducedPoints[0].x} ${reducedPoints[0].y}`;
    
    // Line to first midpoint
    const firstMidX = (reducedPoints[0].x + reducedPoints[1].x) / 2;
    const firstMidY = (reducedPoints[0].y + reducedPoints[1].y) / 2;
    path += ` L ${firstMidX} ${firstMidY}`;
    
    // Quadratic curves through midpoints with points as control points
    for (let i = 1; i < reducedPoints.length - 1; i++) {
      const midX = (reducedPoints[i].x + reducedPoints[i + 1].x) / 2;
      const midY = (reducedPoints[i].y + reducedPoints[i + 1].y) / 2;
      path += ` Q ${reducedPoints[i].x} ${reducedPoints[i].y} ${midX} ${midY}`;
    }
    
    // Line to last point
    const lastPoint = reducedPoints[reducedPoints.length - 1];
    path += ` L ${lastPoint.x} ${lastPoint.y}`;
    
    return path;
  };

  const pathD = createSmoothPath(screenTrail);

  return (
    <div
      className="eraser-overlay"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <svg className="eraser-trail">
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#EB5547"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
        )}
      </svg>
    </div>
  );
};

export default Eraser;

