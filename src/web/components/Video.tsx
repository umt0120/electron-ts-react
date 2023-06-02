import { useEffect, useRef } from 'react';

export const Video = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  let videTracks: MediaStreamTrack[] = [];
  let videoTrack: MediaStreamTrack | null = null;
  let animationFrameId: number | null = null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (navigator.mediaDevices.getUserMedia && canvas) {
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
    }
  }, []);
  return (
    <>
      <canvas id="canvas" ref={canvasRef}></canvas>
      <div id="graph"></div>
    </>
  );
};
