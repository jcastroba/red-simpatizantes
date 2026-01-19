import React from 'react';

interface Y2KWindowProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  onBack?: () => void;
  className?: string;
  isStatic?: boolean;
}

const Y2KWindow = ({ title, children, onClose, onBack, className = "", isStatic = false }: Y2KWindowProps) => {
  const windowContent = (
    <div
        onClick={(e) => !isStatic && e.stopPropagation()}
        className={`bg-white/80 backdrop-blur-xl w-full border-2 border-white relative shadow-2xl flex flex-col ${!isStatic ? 'max-w-lg animate-in fade-in zoom-in duration-300' : ''} ${className}`}
    >
      {/* Title bar - always visible */}
      <div className="bg-primary border-b-2 border-white min-h-[40px] h-10 flex items-center justify-between px-2 sm:px-3 select-none shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          {onBack ? (
            <button onClick={onBack} className="text-white font-black text-lg sm:text-xl animate-pulse leading-none pb-1 hover:scale-110 transition-transform cursor-pointer bg-transparent border-none p-0 shrink-0">&lt;</button>
          ) : (
            <span className="text-white font-black text-lg sm:text-xl animate-pulse leading-none pb-1 shrink-0">&lt;</span>
          )}
          <span className="text-white font-bold tracking-wide uppercase text-xs sm:text-sm truncate">{title}</span>
        </div>
        <div className="flex gap-1 shrink-0">
          {onClose && (
            <button onClick={onClose} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-racing-red hover:bg-red-700 text-white font-black text-lg sm:text-xl leading-none border-2 border-white shadow-sm transition-transform active:scale-95">
              ×
            </button>
          )}
          {!onClose && (
            <>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"></div>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"></div>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"></div>
            </>
          )}
        </div>
      </div>
      {/* Content area */}
      <div className="p-3 sm:p-6 flex-grow overflow-auto relative flex flex-col">
        {children}
      </div>
    </div>
  );

  if (isStatic) {
    return windowContent;
  }

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
    >
      {windowContent}
    </div>
  );
};

export default Y2KWindow;
