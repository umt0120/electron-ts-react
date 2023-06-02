import { useEffect, useRef, useState } from 'react';

interface Rectangle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface DragData {
  id: string;
  isResizing: boolean;
  offsetX: number;
  offsetY: number;
  initWidth: number;
  initHeight: number;
}

export const Video = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  let videTracks: MediaStreamTrack[] = [];
  let videoTrack: MediaStreamTrack | null = null;
  let animationFrameId: number | null = null;
  const [isCapturing, setIsCapturing] = useState(false);
  const [rectangles, setRectangles] = useState<Rectangle[]>([
    { id: '1', x: 10, y: 10, width: 100, height: 100, color: 'red' },
    { id: '2', x: 120, y: 120, width: 100, height: 100, color: 'blue' },
  ]);
  const [dragData, setDragData] = useState<DragData | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isCapturing) return;

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(function (stream) {
        videTracks = stream.getVideoTracks();
        if (videTracks.length === 0) return;
        videoTrack = videTracks[0];
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let imageCapture = new ImageCapture(videoTrack);
        const drawFrame = () => {
          imageCapture
            .grabFrame()
            .then((imageBitmap) => {
              canvas.width = imageBitmap.width;
              canvas.height = imageBitmap.height;
              ctx.drawImage(imageBitmap, 0, 0);
              rectangles.forEach((rectangle) => {
                ctx.strokeStyle = rectangle.color;
                ctx.strokeRect(
                  rectangle.x,
                  rectangle.y,
                  rectangle.width,
                  rectangle.height
                );
              });
            })
            .catch((err) => {
              console.log('Something went wrong!', err);
            });
          animationFrameId = requestAnimationFrame(drawFrame);
        };
        drawFrame();
      })
      .catch(function (err) {
        console.log('Something went wrong!', err);
      });
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isCapturing, rectangles]);

  const handleStart = () => {
    setIsCapturing(true);
  };

  const handleStop = () => {
    setIsCapturing(false);
  };
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = rectangles.length - 1; i >= 0; i--) {
      const rectangle = rectangles[i];
      if (
        x >= rectangle.x &&
        x <= rectangle.x + rectangle.width &&
        y >= rectangle.y &&
        y <= rectangle.y + rectangle.height
      ) {
        // clicked inside rectangle
        const isResizing =
          x >= rectangle.x + rectangle.width - 10 &&
          y >= rectangle.y + rectangle.height - 10;
        setDragData({
          id: rectangle.id,
          isResizing,
          offsetX: x - rectangle.x,
          offsetY: y - rectangle.y,
          initWidth: rectangle.width,
          initHeight: rectangle.height,
        });
        break;
      }
    }
  };

  const handleMouseUp = () => {
    setDragData(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragData) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRectangles((rectangles) =>
      rectangles.map((rectangle) => {
        if (rectangle.id !== dragData.id) return rectangle;
        if (dragData.isResizing) {
          return {
            ...rectangle,
            width: dragData.initWidth + x - rectangle.x - dragData.offsetX,
            height: dragData.initHeight + y - rectangle.y - dragData.offsetY,
          };
        } else {
          return {
            ...rectangle,
            x: x - dragData.offsetX,
            y: y - dragData.offsetY,
          };
        }
      })
    );
  };

  return (
    <>
      <canvas
        id="canvas"
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      ></canvas>
      <button onClick={handleStart}>Start</button>
      <button onClick={handleStop}>Stop</button>
      <div id="graph"></div>
    </>
  );
};
