import React from 'react';

interface Y2KWindowProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  onBack?: () => void;
  className?: string;
  isStatic?: boolean;
  contentClassName?: string;
}

const Y2KWindow = ({ title, children, onClose, onBack, className = "", isStatic = false, contentClassName = "" }: Y2KWindowProps) => {
  const windowContent = (
    <div
        onClick={(e) => !isStatic && e.stopPropagation()}
        className={`bg-white/80 backdrop-blur-xl w-full border-2 border-white relative shadow-2xl flex flex-col ${!isStatic ? 'max-w-lg animate-in fade-in zoom-in duration-300' : ''} ${className}`}
    >
      <div className="bg-primary border-b-2 border-white h-10 flex items-center justify-between px-3 select-none shrink-0">
        <div className="flex items-center gap-2">
          {onBack ? (
            <button onClick={onBack} className="text-white font-black text-xl animate-pulse leading-none pb-1 hover:scale-110 transition-transform cursor-pointer bg-transparent border-none p-0">&lt;</button>
          ) : (
            <span className="text-white font-black text-xl animate-pulse leading-none pb-1">&lt;</span>
          )}
          <span className="text-white font-bold tracking-wide uppercase text-sm">{title}</span>
        </div>
        <div className="flex gap-1">
          {onClose && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-racing-red hover:bg-red-700 text-white font-black text-xl leading-none border-2 border-white shadow-sm transition-transform active:scale-95">
              ×
            </button>
          )}
          {!onClose && (
            <>
              <div className="w-2 h-2 rounded-full bg-white"></div>
              <div className="w-2 h-2 rounded-full bg-white"></div>
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </>
          )}
        </div>
      </div>
      <div className={`p-6 flex-grow overflow-auto relative flex flex-col ${contentClassName}`}>
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
