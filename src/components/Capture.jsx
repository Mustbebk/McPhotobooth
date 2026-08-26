import { useEffect, useRef, useState, useCallback } from 'react';

export default function Capture({ layout, onComplete, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const noiseImgRef = useRef(null);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);

  const maxPhotos = layout === 'single' ? 1 : 4;

  useEffect(() => {
    let active = true;
    async function initCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
        });
        if (!active) {
          mediaStream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setIsStreamReady(true);
      } catch (err) {
        if (active) setError('Could not access camera. Please allow permissions.');
      }
    }
    initCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Pre-load noise image for canvas baking
  useEffect(() => {
    const img = new Image();
    img.src = 'data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)" opacity="0.4"/%3E%3C/svg%3E';
    img.onload = () => { noiseImgRef.current = img; };
  }, []);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Apply vintage filter to canvas context to bake it in
    ctx.filter = 'brightness(0.9) contrast(1.05) saturate(1.3) sepia(0.2)';
    
    // mirror the image if front-facing
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Reset transform for overlays
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = 'none';

    // Draw fade/shadow overlay
    ctx.fillStyle = 'rgba(67, 48, 46, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grain overlay
    if (noiseImgRef.current) {
      ctx.globalCompositeOperation = 'overlay';
      // Tile the noise across the canvas
      for (let x = 0; x < canvas.width; x += 200) {
        for (let y = 0; y < canvas.height; y += 200) {
          ctx.drawImage(noiseImgRef.current, x, y, 200, 200);
        }
      }
      ctx.globalCompositeOperation = 'source-over'; // reset
    }
    
    return canvas.toDataURL('image/png');
  }, []);

  const startCaptureSequence = async () => {
    setIsCapturing(true);
    let currentPhotos = [];
    
    for (let i = 0; i < maxPhotos; i++) {
      // 3 second countdown
      for (let c = 3; c > 0; c--) {
        setCountdown(c);
        await new Promise(r => setTimeout(r, 1000));
      }
      setCountdown(null);
      
      // snap!
      const photoData = takePhoto();
      if (photoData) {
        currentPhotos.push(photoData);
        setCapturedPhotos([...currentPhotos]);
      }
      
      // brief pause to show flash/freeze (optional, just wait 500ms before next countdown)
      if (i < maxPhotos - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    // Cleanup and complete
    setIsCapturing(false);
    onComplete(currentPhotos);
  };

  const handleCancel = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onCancel();
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-4 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-2xl font-bold">Capture ({capturedPhotos.length}/{maxPhotos})</h2>
        <p className="font-medium bg-powder px-3 py-1 rounded-full text-burgundy text-sm uppercase tracking-wide">
          Layout: {layout}
        </p>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 border border-red-300 rounded w-full text-center">
          {error}
        </div>
      )}

      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border-4 border-burgundy shadow-lg">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover transform -scale-x-100 vintage-filter" 
        />
        
        {/* Vintage Overlay for live preview */}
        <div className="vintage-overlay absolute inset-0 z-0"></div>
        
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10 backdrop-blur-sm transition-all duration-300">
            <span className="text-9xl font-bold text-white drop-shadow-xl animate-bounce">
              {countdown}
            </span>
          </div>
        )}

        {/* White flash effect on capture */}
        {countdown === null && isCapturing && capturedPhotos.length > 0 && capturedPhotos.length < maxPhotos && (
           <div className="absolute inset-0 bg-white opacity-0 animate-[flash_0.5s_ease-out]"></div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Thumbnails of captured photos */}
      {capturedPhotos.length > 0 && (
        <div className="flex gap-2 w-full justify-center h-16">
          {capturedPhotos.map((data, idx) => (
            <img key={idx} src={data} alt={`Shot ${idx+1}`} className="h-full rounded border-2 border-burgundy object-cover aspect-video" />
          ))}
          {/* Empty slots */}
          {Array.from({ length: maxPhotos - capturedPhotos.length }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-full aspect-video rounded border-2 border-burgundy/30 bg-burgundy/10"></div>
          ))}
        </div>
      )}

      <div className="flex space-x-4 w-full justify-center mt-6">
        <button 
          onClick={handleCancel}
          disabled={isCapturing}
          className="px-6 py-3 border-2 border-burgundy text-burgundy font-bold rounded-full hover:bg-burgundy/10 transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button 
          onClick={startCaptureSequence}
          disabled={isCapturing || error || !isStreamReady}
          className="px-10 py-3 bg-burgundy text-buttermilk font-bold text-xl rounded-full shadow-lg hover:bg-burgundy/90 transition disabled:opacity-50"
        >
          {isCapturing ? 'Capturing...' : 'Start Capture'}
        </button>
      </div>
    </div>
  );
}
