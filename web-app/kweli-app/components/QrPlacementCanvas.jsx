"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

/**
 * Interactive QR Placement Canvas
 * FIXED: Now saves placement in ORIGINAL image coordinates, not scaled canvas coordinates
 */
export default function QrPlacementCanvas({ 
  imageUrl, 
  initialPlacement,
  onPlacementChange,
  imageDimensions 
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const lastNotifiedRef = useRef(null);
  
  // Store placement in ORIGINAL image coordinates
  const [placement, setPlacement] = useState(initialPlacement ? { ...initialPlacement } : {
    x: 100,
    y: 100,
    width: 200,
    height: 200
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Load image
  useEffect(() => {
    if (!imageUrl) {
      setError('No image URL provided');
      return;
    }

    setError(null);
    const img = new Image();
    
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    
    img.onerror = () => {
      setError('Failed to load image. Please check the file URL.');
      setImageLoaded(false);
    };
    
    img.src = imageUrl;

    return () => {
      imageRef.current = null;
    };
  }, [imageUrl]);

  // Update placement when initialPlacement changes
  useEffect(() => {
    if (initialPlacement) {
      setPlacement({ ...initialPlacement });
      lastNotifiedRef.current = { ...initialPlacement };
    }
  }, [initialPlacement]);

  // Calculate scale to fit canvas
  useEffect(() => {
    if (!containerRef.current || !imageDimensions || !imageLoaded) return;

    try {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight || 600;
      
      if (imageDimensions.width <= 0 || imageDimensions.height <= 0) {
        setError('Invalid image dimensions');
        return;
      }
      
      const scaleX = containerWidth / imageDimensions.width;
      const scaleY = containerHeight / imageDimensions.height;
      const newScale = Math.min(scaleX, scaleY, 1);
      
      if (newScale > 0) {
        setScale(newScale);
        setError(null);
      }
    } catch (err) {
      setError('Failed to calculate canvas scale');
      console.error(err);
    }
  }, [imageDimensions, imageLoaded]);

  // Helper: Convert original coordinates to scaled canvas coordinates
  const toCanvasCoords = useCallback((original) => {
    return {
      x: original.x * scale,
      y: original.y * scale,
      width: original.width * scale,
      height: original.height * scale
    };
  }, [scale]);

  // Helper: Convert scaled canvas coordinates to original image coordinates
  const toOriginalCoords = useCallback((canvas) => {
    return {
      x: Math.round(canvas.x / scale),
      y: Math.round(canvas.y / scale),
      width: Math.round(canvas.width / scale),
      height: Math.round(canvas.height / scale)
    };
  }, [scale]);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    
    if (!canvas || !img || scale === 0) return;

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Failed to get canvas context');
        return;
      }
      
      // Set canvas size to scaled dimensions
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // Draw image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert placement to canvas coordinates for drawing
      const canvasPlacement = toCanvasCoords(placement);

      // Draw QR placement box with border
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      ctx.strokeRect(
        canvasPlacement.x, 
        canvasPlacement.y, 
        canvasPlacement.width, 
        canvasPlacement.height
      );

      // Draw semi-transparent overlay
      ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
      ctx.fillRect(
        canvasPlacement.x, 
        canvasPlacement.y, 
        canvasPlacement.width, 
        canvasPlacement.height
      );

      // Draw resize handles
      ctx.fillStyle = '#22c55e';
      ctx.setLineDash([]);
      const handleSize = 12;
      
      const handles = [
        { x: canvasPlacement.x, y: canvasPlacement.y },
        { x: canvasPlacement.x + canvasPlacement.width, y: canvasPlacement.y },
        { x: canvasPlacement.x, y: canvasPlacement.y + canvasPlacement.height },
        { x: canvasPlacement.x + canvasPlacement.width, y: canvasPlacement.y + canvasPlacement.height }
      ];
      
      handles.forEach(handle => {
        ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
      });

      // Draw "QR CODE HERE" text
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        'QR CODE HERE',
        canvasPlacement.x + canvasPlacement.width / 2,
        canvasPlacement.y + canvasPlacement.height / 2
      );
      
      setError(null);
    } catch (err) {
      setError('Failed to draw canvas');
      console.error(err);
    }
  }, [placement, scale, toCanvasCoords]);

  // Redraw when placement or scale changes
  useEffect(() => {
    if (!imageLoaded) return;
    drawCanvas();
  }, [imageLoaded, drawCanvas]);

  // Notify parent of placement changes (in ORIGINAL coordinates)
  useEffect(() => {
    if (!onPlacementChange || isDragging || isResizing) return;

    const timeoutId = setTimeout(() => {
      // Check if placement has actually changed
      if (lastNotifiedRef.current &&
          lastNotifiedRef.current.x === placement.x &&
          lastNotifiedRef.current.y === placement.y &&
          lastNotifiedRef.current.width === placement.width &&
          lastNotifiedRef.current.height === placement.height) {
        return;
      }

      lastNotifiedRef.current = { ...placement };
      // Send ORIGINAL coordinates to parent (already in original space)
      onPlacementChange({ ...placement });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [placement, isDragging, isResizing, onPlacementChange]);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const isInResizeHandle = (mouseX, mouseY) => {
    const handleSize = 12;
    const canvasPlacement = toCanvasCoords(placement);
    
    const handles = [
      { x: canvasPlacement.x, y: canvasPlacement.y },
      { x: canvasPlacement.x + canvasPlacement.width, y: canvasPlacement.y },
      { x: canvasPlacement.x, y: canvasPlacement.y + canvasPlacement.height },
      { x: canvasPlacement.x + canvasPlacement.width, y: canvasPlacement.y + canvasPlacement.height }
    ];

    for (let i = 0; i < handles.length; i++) {
      const handle = handles[i];
      if (
        mouseX >= handle.x - handleSize/2 &&
        mouseX <= handle.x + handleSize/2 &&
        mouseY >= handle.y - handleSize/2 &&
        mouseY <= handle.y + handleSize/2
      ) {
        return { ...handle, index: i };
      }
    }
    return null;
  };

  const isInPlacement = (mouseX, mouseY) => {
    const canvasPlacement = toCanvasCoords(placement);
    return (
      mouseX >= canvasPlacement.x &&
      mouseX <= canvasPlacement.x + canvasPlacement.width &&
      mouseY >= canvasPlacement.y &&
      mouseY <= canvasPlacement.y + canvasPlacement.height
    );
  };

  const handleMouseDown = (e) => {
    if (isDragging || isResizing) return;

    const pos = getMousePos(e);
    const canvasPlacement = toCanvasCoords(placement);
    
    const resizeHandle = isInResizeHandle(pos.x, pos.y);
    if (resizeHandle) {
      setIsResizing(true);
      setDragStart({ 
        x: pos.x, 
        y: pos.y, 
        handle: resizeHandle,
        originalPlacement: { ...placement }
      });
      return;
    }

    if (isInPlacement(pos.x, pos.y)) {
      setIsDragging(true);
      setDragStart({
        x: pos.x - canvasPlacement.x,
        y: pos.y - canvasPlacement.y
      });
    }
  };

  const handleMouseMove = (e) => {
    const pos = getMousePos(e);
    const canvas = canvasRef.current;
    const img = imageRef.current;

    if (!canvas || !img) return;

    if (isDragging) {
      // Calculate new position in canvas space
      const canvasX = Math.max(0, Math.min(pos.x - dragStart.x, canvas.width - placement.width * scale));
      const canvasY = Math.max(0, Math.min(pos.y - dragStart.y, canvas.height - placement.height * scale));
      
      // Convert back to original image space
      const originalCoords = toOriginalCoords({
        x: canvasX,
        y: canvasY,
        width: placement.width * scale,
        height: placement.height * scale
      });
      
      setPlacement(prev => ({
        ...prev,
        x: originalCoords.x,
        y: originalCoords.y
      }));
    } else if (isResizing) {
      const handle = dragStart.handle;
      const canvasPlacement = toCanvasCoords(dragStart.originalPlacement);
      
      let newCanvasPlacement = { ...canvasPlacement };

      // Handle different corners
      if (handle.index === 0) {
        // Top-left
        newCanvasPlacement.x = Math.min(pos.x, canvasPlacement.x + canvasPlacement.width - 50);
        newCanvasPlacement.y = Math.min(pos.y, canvasPlacement.y + canvasPlacement.height - 50);
        newCanvasPlacement.width = canvasPlacement.width + (canvasPlacement.x - newCanvasPlacement.x);
        newCanvasPlacement.height = canvasPlacement.height + (canvasPlacement.y - newCanvasPlacement.y);
      } else if (handle.index === 1) {
        // Top-right
        newCanvasPlacement.y = Math.min(pos.y, canvasPlacement.y + canvasPlacement.height - 50);
        newCanvasPlacement.width = Math.max(50, pos.x - canvasPlacement.x);
        newCanvasPlacement.height = canvasPlacement.height + (canvasPlacement.y - newCanvasPlacement.y);
      } else if (handle.index === 2) {
        // Bottom-left
        newCanvasPlacement.x = Math.min(pos.x, canvasPlacement.x + canvasPlacement.width - 50);
        newCanvasPlacement.width = canvasPlacement.width + (canvasPlacement.x - newCanvasPlacement.x);
        newCanvasPlacement.height = Math.max(50, pos.y - canvasPlacement.y);
      } else {
        // Bottom-right
        newCanvasPlacement.width = Math.max(50, pos.x - canvasPlacement.x);
        newCanvasPlacement.height = Math.max(50, pos.y - canvasPlacement.y);
      }

      // Ensure placement stays within bounds
      newCanvasPlacement.x = Math.max(0, newCanvasPlacement.x);
      newCanvasPlacement.y = Math.max(0, newCanvasPlacement.y);
      newCanvasPlacement.width = Math.min(newCanvasPlacement.width, canvas.width - newCanvasPlacement.x);
      newCanvasPlacement.height = Math.min(newCanvasPlacement.height, canvas.height - newCanvasPlacement.y);

      // Convert back to original coordinates
      const originalPlacement = toOriginalCoords(newCanvasPlacement);
      setPlacement(originalPlacement);
    } else {
      // Update cursor
      const resizeHandle = isInResizeHandle(pos.x, pos.y);
      if (resizeHandle) {
        canvas.style.cursor = 'nwse-resize';
      } else if (isInPlacement(pos.x, pos.y)) {
        canvas.style.cursor = 'move';
      } else {
        canvas.style.cursor = 'default';
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const resetPlacement = () => {
    if (!imageDimensions) return;

    const defaultSize = 200;
    const newPlacement = {
      x: Math.max(0, (imageDimensions.width - defaultSize) / 2),
      y: Math.max(0, (imageDimensions.height - defaultSize) / 2),
      width: defaultSize,
      height: defaultSize
    };
    
    setPlacement(newPlacement);
    lastNotifiedRef.current = null;
  };

  if (error) {
    return (
      <Card className="p-4 bg-red-50 border-red-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">Canvas Error</h4>
            <p className="text-sm text-red-800 mt-1">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">QR Code Placement</h3>
            <p className="text-sm text-muted-foreground">
              Drag the box to position the QR code, resize using corner handles
            </p>
          </div>
          <button
            onClick={resetPlacement}
            className="px-3 py-1 text-sm border rounded hover:bg-muted transition-colors"
          >
            Reset
          </button>
        </div>

        <div 
          ref={containerRef}
          className="border rounded-lg overflow-hidden bg-muted/30"
          style={{ maxHeight: '600px' }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-full h-auto cursor-default"
          />
        </div>

        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="p-2 border rounded">
            <span className="text-muted-foreground text-xs">X:</span>{' '}
            <span className="font-mono text-sm">{Math.round(placement.x)}px</span>
          </div>
          <div className="p-2 border rounded">
            <span className="text-muted-foreground text-xs">Y:</span>{' '}
            <span className="font-mono text-sm">{Math.round(placement.y)}px</span>
          </div>
          <div className="p-2 border rounded">
            <span className="text-muted-foreground text-xs">Width:</span>{' '}
            <span className="font-mono text-sm">{Math.round(placement.width)}px</span>
          </div>
          <div className="p-2 border rounded">
            <span className="text-muted-foreground text-xs">Height:</span>{' '}
            <span className="font-mono text-sm">{Math.round(placement.height)}px</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center p-2 bg-muted/50 rounded">
          💡 Coordinates shown are in original image pixels (not scaled)
        </div>
      </div>
    </Card>
  );
}