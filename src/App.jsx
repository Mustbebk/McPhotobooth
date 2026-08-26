import { useState } from 'react';
import Landing from './components/Landing';
import Capture from './components/Capture';
import Compose from './components/Compose';
import Editor from './components/Editor';

function App() {
  const [currentStep, setCurrentStep] = useState('landing');
  const [layout, setLayout] = useState('single'); // 'strip', 'grid', 'single'
  const [photos, setPhotos] = useState([]); // array of captured photo data URLs

  // Navigation handlers
  const handleStart = () => setCurrentStep('capture');
  const handleCaptureComplete = (capturedPhotos) => {
    setPhotos(capturedPhotos);
    setCurrentStep('compose');
  };
  const handleRetake = () => {
    setPhotos([]);
    setCurrentStep('capture');
  };
  const handleEdit = () => setCurrentStep('editor');
  const handleRestart = () => {
    setPhotos([]);
    setLayout('single');
    setCurrentStep('landing');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-buttermilk shadow-xl rounded-2xl overflow-hidden min-h-[600px] border-4 border-burgundy">
        
        {/* Simple Header */}
        <header className="bg-burgundy text-buttermilk p-4 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-widest">Vintage Photobooth</h1>
        </header>

        {/* Dynamic Step Rendering */}
        <main className="p-6">
          {currentStep === 'landing' && (
            <Landing onStart={handleStart} layout={layout} setLayout={setLayout} />
          )}
          {currentStep === 'capture' && (
            <Capture layout={layout} onComplete={handleCaptureComplete} onCancel={handleRestart} />
          )}
          {currentStep === 'compose' && (
            <Compose photos={photos} layout={layout} onRetake={handleRetake} onEdit={handleEdit} />
          )}
          {currentStep === 'editor' && (
            <Editor photos={photos} layout={layout} onRestart={handleRestart} />
          )}
        </main>
        
      </div>
    </div>
  );
}

export default App;
