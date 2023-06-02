import { useEffect, useRef, useState } from 'react';

interface Rectangle {
  startX: number;
  startY: number;
  width: number;
  height: number;
}

export const Video = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  let videTracks: MediaStreamTrack[] = [];
  let videoTrack: MediaStreamTrack | null = null;
  let animationFrameId: number | null = null;
  const [isCapturing, setIsCapturing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [rectangle, setRectangle] = useState<Rectangle | null>(null);

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
              if (rectangle) {
                ctx.strokeStyle = 'red';
                ctx.strokeRect(
                  rectangle.startX,
                  rectangle.startY,
                  rectangle.width,
                  rectangle.height
                );
              }
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
  }, [isCapturing, rectangle]);

  const handleStart = () => {
    setIsCapturing(true);
  };

  const handleStop = () => {
    setIsCapturing(false);
  };
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setRectangle({
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      width: 0,
      height: 0,
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !rectangle) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setRectangle({
      ...rectangle,
      width: e.clientX - rect.left - rectangle.startX,
      height: e.clientY - rect.top - rectangle.startY,
    });
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
