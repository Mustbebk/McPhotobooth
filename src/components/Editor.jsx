import { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';

// Utility to combine captured photos into one base image
const generateBaseImage = async (photos, layout) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Assuming each photo is 1280x720 (16:9)
    const photoW = 1280;
    const photoH = 720;
    const padding = 40;
    
    let canvasW, canvasH;
    
    if (layout === 'single') {
      canvasW = photoW + padding * 2;
      canvasH = photoH + padding * 2;
    } else if (layout === 'strip') {
      canvasW = photoW + padding * 2;
      canvasH = (photoH * 4) + (padding * 5) + 120;
    } else if (layout === 'grid') {
      canvasW = (photoW * 2) + (padding * 3);
      canvasH = (photoH * 2) + (padding * 3);
    }
    
    canvas.width = canvasW;
    canvas.height = canvasH;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);
    
    const imgObjs = photos.map(src => {
      const img = new Image();
      img.src = src;
      return new Promise(r => { img.onload = () => r(img); });
    });
    
    Promise.all(imgObjs).then(images => {
      if (layout === 'single') {
        ctx.drawImage(images[0], padding, padding, photoW, photoH);
      } else if (layout === 'strip') {
        images.forEach((img, i) => {
          ctx.drawImage(img, padding, padding + (i * (photoH + padding)), photoW, photoH);
        });
      } else if (layout === 'grid') {
        images.forEach((img, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          ctx.drawImage(img, padding + col * (photoW + padding), padding + row * (photoH + padding), photoW, photoH);
        });
      }
      resolve(canvas.toDataURL('image/png'));
    });
  });
};

const StickerItem = ({ packId, stickerName, onAdd }) => {
  const [hasError, setHasError] = useState(false);
  const url = `/stickers/${packId}/${stickerName}`;

  return (
    <div 
      onClick={() => onAdd(url)}
      className="cursor-pointer bg-gray-50 hover:bg-gray-200 rounded-lg transition flex items-center justify-center w-20 h-20 border border-transparent hover:border-burgundy/40 shadow-sm"
    >
      {hasError ? (
        <div className="w-full h-full border-2 border-dashed border-gray-400 rounded flex flex-col items-center justify-center text-gray-500 text-[10px] text-center p-1 font-medium bg-gray-100">
          <span className="text-xl opacity-50 mb-1">?</span>
          Placeholder
        </div>
      ) : (
        <img 
          src={url} 
          alt={stickerName} 
          onError={() => setHasError(true)}
          className="max-w-full max-h-full object-contain p-1"
        />
      )}
    </div>
  );
};

export default function Editor({ photos, layout, onRestart }) {
  const canvasElRef = useRef(null);
  const containerRef = useRef(null);
  const fabricRef = useRef(null);
  const [baseLoaded, setBaseLoaded] = useState(false);
  const [packs, setPacks] = useState([]);

  // Delete key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const canvas = fabricRef.current;
        if (canvas) {
          const activeObjects = canvas.getActiveObjects();
          if (activeObjects.length) {
            canvas.discardActiveObject();
            activeObjects.forEach(obj => {
              if (obj.selectable) canvas.remove(obj);
            });
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch Manifest
  useEffect(() => {
    fetch('/stickers/manifest.json')
      .then(res => res.json())
      .then(data => setPacks(data.packs || []))
      .catch(err => console.log('Stickers manifest not found', err));
  }, []);

  useEffect(() => {
    if (!photos || photos.length === 0) return;

    const canvas = new fabric.Canvas(canvasElRef.current, {
      selection: false,
    });
    fabricRef.current = canvas;

    const initBase = async () => {
      const baseDataUrl = await generateBaseImage(photos, layout);
      
      fabric.Image.fromURL(baseDataUrl, (img) => {
        if (!containerRef.current) return;
        
        const containerW = containerRef.current.clientWidth;
        const scale = containerW / img.width;
        
        canvas.setWidth(containerW);
        canvas.setHeight(img.height * scale);
        
        img.set({
          originX: 'left',
          originY: 'top',
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
        });
        
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
        setBaseLoaded(true);
      });
    };

    initBase();

    return () => {
      canvas.dispose();
    };
  }, [photos, layout]);

  const handleAddSticker = useCallback((url) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const imgEl = new Image();
    imgEl.src = url;
    
    const styleControls = (obj) => {
      obj.set({
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: 'center',
        originY: 'center',
        transparentCorners: false,
        cornerColor: '#43302E',
        cornerStrokeColor: '#43302E',
        borderColor: '#43302E',
        cornerSize: 12,
        padding: 10,
      });
      obj.setControlsVisibility({
        mb: false, mt: false, ml: false, mr: false // corner resizing only
      });
      canvas.add(obj);
      canvas.setActiveObject(obj);
    };

    imgEl.onload = () => {
      const imgInstance = new fabric.Image(imgEl);
      if (imgInstance.width > canvas.width / 3) {
        imgInstance.scaleToWidth(canvas.width / 3);
      }
      styleControls(imgInstance);
    };

    imgEl.onerror = () => {
      // Fallback: render a gray outlined square placeholder
      const rect = new fabric.Rect({
        width: 120,
        height: 120,
        fill: 'rgba(0,0,0,0.05)',
        stroke: '#888',
        strokeWidth: 2,
        strokeDashArray: [5, 5]
      });
      styleControls(rect);
    };
  }, []);

  const handleDownload = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    // Deselect all objects to hide bounding boxes
    canvas.discardActiveObject();
    canvas.renderAll();
    
    const dataURL = canvas.toDataURL({
      format: 'png',
      multiplier: 2 // export at 2x resolution for higher quality
    });
    
    const link = document.createElement('a');
    link.download = `photobooth-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-4 w-full max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-center">Decorate</h2>
      
      <div className="flex w-full gap-6">
        <div ref={containerRef} className="flex-1 bg-powder/20 p-6 rounded-xl border-2 border-burgundy/20 shadow-inner flex items-start justify-center min-h-[600px]">
          {!baseLoaded && <p className="text-burgundy font-medium animate-pulse">Loading canvas...</p>}
          <div className={baseLoaded ? 'shadow-2xl border border-gray-300' : 'hidden'}>
            <canvas ref={canvasElRef} />
          </div>
        </div>

        <div className="w-80 bg-white p-6 rounded-xl border-2 border-burgundy shadow-lg flex flex-col h-[700px] sticky top-4">
          <h3 className="font-bold text-xl mb-4 text-center border-b-2 border-burgundy/10 pb-4">Stickers</h3>
          
          <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
            {packs.length === 0 && (
              <p className="text-center text-burgundy/50 text-sm mt-10">No sticker packs found.</p>
            )}
            {packs.map(pack => (
              <div key={pack.id}>
                <h4 className="font-semibold text-burgundy mb-2">{pack.name}</h4>
                <div className="grid grid-cols-3 gap-2">
                  {pack.stickers.map((sticker, idx) => (
                    <StickerItem 
                      key={idx} 
                      packId={pack.id} 
                      stickerName={sticker} 
                      onAdd={handleAddSticker} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t-2 border-burgundy/10 text-xs text-burgundy/60 text-center mb-4">
            Select a sticker, then drag to move. <br/> Use corners to resize/rotate. <br/> Press <kbd className="bg-gray-100 border border-gray-300 px-1 rounded">Backspace</kbd> to delete.
          </div>

          <button 
            onClick={handleDownload}
            className="w-full py-3 bg-burgundy text-buttermilk font-bold text-lg rounded-full shadow hover:bg-burgundy/90 transition hover:scale-[1.02]"
          >
            Download PNG
          </button>
        </div>
      </div>

      <div className="pt-4 w-full flex justify-center">
        <button 
          onClick={onRestart}
          className="px-6 py-3 border-2 border-burgundy text-burgundy font-bold rounded-full hover:bg-burgundy/10 transition"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
