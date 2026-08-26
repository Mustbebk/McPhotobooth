export default function Landing({ onStart, layout, setLayout }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-3xl font-bold">Welcome to the Booth</h2>
        <p className="text-lg">
          Take a series of photos with a vintage feel, assemble them, and decorate with stickers!
        </p>
      </div>

      <div className="bg-white/50 p-6 rounded-xl border-2 border-burgundy/20 w-full max-w-sm">
        <h3 className="font-bold text-lg mb-4 text-center">Select Layout</h3>
        <div className="flex flex-col space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-white/40 rounded transition">
            <input 
              type="radio" 
              name="layout" 
              value="single" 
              checked={layout === 'single'} 
              onChange={(e) => setLayout(e.target.value)}
              className="w-5 h-5 accent-burgundy"
            />
            <span className="font-medium text-lg">Single Photo</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-white/40 rounded transition">
            <input 
              type="radio" 
              name="layout" 
              value="strip" 
              checked={layout === 'strip'} 
              onChange={(e) => setLayout(e.target.value)}
              className="w-5 h-5 accent-burgundy"
            />
            <span className="font-medium text-lg">Photo Strip (4 shots)</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-white/40 rounded transition">
            <input 
              type="radio" 
              name="layout" 
              value="grid" 
              checked={layout === 'grid'} 
              onChange={(e) => setLayout(e.target.value)}
              className="w-5 h-5 accent-burgundy"
            />
            <span className="font-medium text-lg">2x2 Grid (4 shots)</span>
          </label>
        </div>
      </div>

      <button 
        onClick={onStart}
        className="px-10 py-4 bg-burgundy text-buttermilk font-bold text-xl rounded-full shadow-lg hover:scale-105 transition-transform"
      >
        Start Photo Session
      </button>
    </div>
  );
}
