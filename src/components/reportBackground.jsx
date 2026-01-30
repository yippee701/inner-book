export function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div 
        className="absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-60"
        style={{ 
          background: '#E9D5FF',
          top: '-100px',
          left: '-100px'
        }}
      />
      <div 
        className="absolute w-[350px] h-[350px] rounded-full blur-3xl opacity-60"
        style={{ 
          background: '#F5F3FF',
          bottom: '0',
          right: '-100px'
        }}
      />
      <div 
        className="absolute w-[200px] h-[200px] rounded-full blur-3xl opacity-40"
        style={{ 
          background: '#E0E7FF',
          top: '40%',
          left: '20%'
        }}
      />
    </div>
  );
}
