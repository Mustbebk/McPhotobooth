import React from 'react';

export default function Compose({ photos, layout, onRetake, onEdit }) {
  if (!photos || photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-8">
        <p className="text-xl font-medium">No photos captured.</p>
        <button 
          onClick={onRetake}
          className="px-6 py-2 border-2 border-burgundy text-burgundy font-bold rounded-full hover:bg-burgundy/10 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Render the selected layout using HTML/CSS
  const renderLayout = () => {
    switch (layout) {
      case 'single':
        return (
          <div className="bg-white p-4 shadow-2xl border border-gray-200">
            <img src={photos[0]} alt="Single Capture" className="w-full max-w-2xl object-cover aspect-video" />
          </div>
        );
      case 'strip':
        return (
          <div className="bg-white p-4 pb-16 shadow-2xl border border-gray-200 flex flex-col space-y-4 w-72">
            {photos.map((src, idx) => (
              <img key={idx} src={src} alt={`Strip ${idx}`} className="w-full object-cover aspect-video bg-gray-100" />
            ))}
          </div>
        );
      case 'grid':
        return (
          <div className="bg-white p-4 pb-12 shadow-2xl border border-gray-200 w-[600px]">
            <div className="grid grid-cols-2 gap-4">
              {photos.map((src, idx) => (
                <img key={idx} src={src} alt={`Grid ${idx}`} className="w-full object-cover aspect-video bg-gray-100" />
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-4 w-full max-w-5xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Review Your Photos</h2>
        <p className="text-burgundy/80 mt-2 font-medium">Looking good! Ready to decorate?</p>
      </div>
      
      {/* The composed layout container */}
      <div className="flex items-center justify-center bg-powder/20 p-8 rounded-xl border-2 border-burgundy/10 w-full min-h-[500px]">
        {renderLayout()}
      </div>

      <div className="flex space-x-4">
        <button 
          onClick={onRetake}
          className="px-8 py-3 border-2 border-burgundy text-burgundy font-bold text-lg rounded-full hover:bg-burgundy/10 transition"
        >
          Retake
        </button>
        <button 
          onClick={onEdit}
          className="px-10 py-3 bg-burgundy text-buttermilk font-bold text-xl rounded-full shadow-lg hover:bg-burgundy/90 transition"
        >
          Decorate (Editor)
        </button>
      </div>
    </div>
  );
}
