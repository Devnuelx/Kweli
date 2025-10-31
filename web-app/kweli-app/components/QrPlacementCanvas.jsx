"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

/**
 * Interactive QR Placement Canvas
 * Allows users to drag and resize QR placement box on design preview
 * 
 * PRINCIPLE: Keep internal state in SCALED coordinates (canvas space),
 * only convert to original coordinates when notifying parent.
 * This prevents feedback loops and precision issues.
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
  const lastNotifiedRef = useRef(null); // Track last notified placement to prevent duplicate notifications
  
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

  // Load image only once
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

  // Update placement when initialPlacement changes from parent
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

  // Draw canvas - memoized to prevent recreating the function
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
      
      // Set canvas size
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // Draw image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw QR placement box with border
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      ctx.strokeRect(placement.x, placement.y, placement.width, placement.height);

      // Draw semi-transparent overlay
      ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
      ctx.fillRect(placement.x, placement.y, placement.width, placement.height);

      // Draw resize handles
      ctx.fillStyle = '#22c55e';
      ctx.setLineDash([]);
      const handleSize = 12;
      
      const handles = [
        { x: placement.x, y: placement.y }, // Top-left
        { x: placement.x + placement.width, y: placement.y }, // Top-right
        { x: placement.x, y: placement.y + placement.height }, // Bottom-left
        { x: placement.x + placement.width, y: placement.y + placement.height } // Bottom-right
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
        placement.x + placement.width / 2,
        placement.y + placement.height / 2
      );
      
      setError(null);
    } catch (err) {
      setError('Failed to draw canvas');
      console.error(err);
    }
  }, [placement.x, placement.y, placement.width, placement.height, scale]);

  // Redraw when placement or scale changes
  useEffect(() => {
    if (!imageLoaded) return;
    drawCanvas();
  }, [imageLoaded, drawCanvas]);

  // Notify parent of placement changes - only when user stops interacting
  useEffect(() => {
    if (!onPlacementChange || isDragging || isResizing) return;

    const timeoutId = setTimeout(() => {
      // Check if placement has actually changed from last notification
      if (lastNotifiedRef.current &&
          lastNotifiedRef.current.x === placement.x &&
          lastNotifiedRef.current.y === placement.y &&
          lastNotifiedRef.current.width === placement.width &&
          lastNotifiedRef.current.height === placement.height) {
        return; // No change, don't notify
      }

      lastNotifiedRef.current = { ...placement };
      onPlacementChange({ ...placement });
    }, 300); // Debounce to give user time to finish dragging

    return () => clearTimeout(timeoutId);
  }, [placement, isDragging, isResizing, onPlacementChange]);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const isInResizeHandle = (mouseX, mouseY) => {
    const handleSize = 12;
    const handles = [
      { x: placement.x, y: placement.y },
      { x: placement.x + placement.width, y: placement.y },
      { x: placement.x, y: placement.y + placement.height },
      { x: placement.x + placement.width, y: placement.y + placement.height }
    ];

    for (const handle of handles) {
      if (
        mouseX >= handle.x - handleSize/2 &&
        mouseX <= handle.x + handleSize/2 &&
        mouseY >= handle.y - handleSize/2 &&
        mouseY <= handle.y + handleSize/2
      ) {
        return handle;
      }
    }
    return null;
  };

  const isInPlacement = (mouseX, mouseY) => {
    return (
      mouseX >= placement.x &&
      mouseX <= placement.x + placement.width &&
      mouseY >= placement.y &&
      mouseY <= placement.y + placement.height
    );
  };

  const handleMouseDown = (e) => {
    if (isDragging || isResizing) return;

    const pos = getMousePos(e);
    
    const resizeHandle = isInResizeHandle(pos.x, pos.y);
    if (resizeHandle) {
      setIsResizing(true);
      setDragStart({ x: pos.x, y: pos.y, handle: resizeHandle });
      return;
    }

    if (isInPlacement(pos.x, pos.y)) {
      setIsDragging(true);
      setDragStart({
        x: pos.x - placement.x,
        y: pos.y - placement.y
      });
    }
  };

  const handleMouseMove = (e) => {
    const pos = getMousePos(e);
    const canvas = canvasRef.current;

    if (!canvas) return;

    if (isDragging) {
      const newX = Math.max(0, Math.min(pos.x - dragStart.x, canvas.width - placement.width));
      const newY = Math.max(0, Math.min(pos.y - dragStart.y, canvas.height - placement.height));
      
      setPlacement(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
    } else if (isResizing) {
      const handle = dragStart.handle;
      let newPlacement = { ...placement };

      if (handle.x === placement.x && handle.y === placement.y) {
        // Top-left
        newPlacement.x = Math.min(pos.x, placement.x + placement.width - 50);
        newPlacement.y = Math.min(pos.y, placement.y + placement.height - 50);
        newPlacement.width = placement.width + (placement.x - newPlacement.x);
        newPlacement.height = placement.height + (placement.y - newPlacement.y);
      } else if (handle.x === placement.x + placement.width && handle.y === placement.y) {
        // Top-right
        newPlacement.y = Math.min(pos.y, placement.y + placement.height - 50);
        newPlacement.width = Math.max(50, pos.x - placement.x);
        newPlacement.height = placement.height + (placement.y - newPlacement.y);
      } else if (handle.x === placement.x && handle.y === placement.y + placement.height) {
        // Bottom-left
        newPlacement.x = Math.min(pos.x, placement.x + placement.width - 50);
        newPlacement.width = placement.width + (placement.x - newPlacement.x);
        newPlacement.height = Math.max(50, pos.y - placement.y);
      } else {
        // Bottom-right
        newPlacement.width = Math.max(50, pos.x - placement.x);
        newPlacement.height = Math.max(50, pos.y - placement.y);
      }

      // Ensure placement stays within bounds
      newPlacement.x = Math.max(0, newPlacement.x);
      newPlacement.y = Math.max(0, newPlacement.y);
      newPlacement.width = Math.min(newPlacement.width, canvas.width - newPlacement.x);
      newPlacement.height = Math.min(newPlacement.height, canvas.height - newPlacement.y);

      setPlacement(newPlacement);
      setDragStart({ ...dragStart, x: pos.x, y: pos.y });
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const defaultSize = 200;
    const newPlacement = {
      x: Math.max(0, (canvas.width - defaultSize) / 2),
      y: Math.max(0, (canvas.height - defaultSize) / 2),
      width: defaultSize,
      height: defaultSize
    };
    
    setPlacement(newPlacement);
    lastNotifiedRef.current = null; // Force notification on next interaction stop
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
            <span className="font-mono text-sm">{Math.round(placement.x)}</span>
          </div>
          <div className="p-2 border rounded">
            <span className="text-muted-foreground text-xs">Y:</span>{' '}
            <span className="font-mono text-sm">{Math.round(placement.y)}</span>
          </div>
          <div className="p-2 border rounded">
            <span className="text-muted-foreground text-xs">Width:</span>{' '}
            <span className="font-mono text-sm">{Math.round(placement.width)}</span>
          </div>
          <div className="p-2 border rounded">
            <span className="text-muted-foreground text-xs">Height:</span>{' '}
            <span className="font-mono text-sm">{Math.round(placement.height)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}