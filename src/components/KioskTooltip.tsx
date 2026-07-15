import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface KioskTooltipProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
}

export default function KioskTooltip({ text, position = 'top', offset }: KioskTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Position classes
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  // Arrow style classes
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-wood border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-wood border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-wood border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-wood border-y-transparent border-l-transparent',
  };

  return (
    <div 
      className="relative inline-block z-30"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="text-terracotta hover:text-terracotta-hover transition-colors focus:outline-none p-1 bg-[#FDFCF8] hover:bg-[#F3EDE2] rounded-full border border-uiborder cursor-pointer animate-pulse-slow"
        title="설명 보기"
        id={`tooltip-btn-${Math.random().toString(36).substr(2, 5)}`}
      >
        <HelpCircle size={18} />
      </button>

      {isOpen && (
        <div className={`absolute ${positionClasses[position]} w-56 p-3 bg-wood text-white rounded-xl shadow-xl text-xs font-bold leading-relaxed border border-uiborder/20 pointer-events-none z-50`}>
          {text}
          <div className={`absolute border-[6px] ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
}
