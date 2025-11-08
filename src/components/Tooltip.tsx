import { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  width?: 'auto' | 'small' | 'medium' | 'large';
  delay?: number;
}

export const Tooltip = ({ 
  text, 
  children, 
  position = 'top',
  width = 'auto',
  delay = 300 
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const updatePosition = (event: React.MouseEvent) => {
    if (!tooltipRef.current) return;

    const rect = tooltipRef.current.getBoundingClientRect();
    let x = event.clientX;
    let y = event.clientY;

    const offset = 8;

    switch (position) {
      case 'top':
        x = x - rect.width / 2;
        y = y - rect.height - offset;
        break;
      case 'bottom':
        x = x - rect.width / 2;
        y = y + offset;
        break;
      case 'left':
        x = x - rect.width - offset;
        y = y - rect.height / 2;
        break;
      case 'right':
        x = x + offset;
        y = y - rect.height / 2;
        break;
    }

    const viewportPadding = 10;
    
    if (x < viewportPadding) x = viewportPadding;
    if (x + rect.width > window.innerWidth - viewportPadding) {
      x = window.innerWidth - rect.width - viewportPadding;
    }
    
    if (y < viewportPadding) y = viewportPadding;
    if (y + rect.height > window.innerHeight - viewportPadding) {
      y = window.innerHeight - rect.height - viewportPadding;
    }

    setCoords({ x, y });
  };

  const handleMouseEnter = (event: React.MouseEvent) => {
    timeoutRef.current = setTimeout(() => {
      updatePosition(event);
      setIsVisible(true);
    }, delay);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isVisible) {
      updatePosition(event);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const getWidthClass = () => {
    switch (width) {
      case 'small': return 'max-w-xs';
      case 'medium': return 'max-w-sm';
      case 'large': return 'max-w-md';
      default: return 'max-w-xs';
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`
            fixed z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg
            border border-gray-700 transform transition-opacity duration-200
            ${getWidthClass()}
          `}
          style={{
            left: `${coords.x}px`,
            top: `${coords.y}px`,
          }}
        >
          {text}
          
          {/* Tooltip arrow */}
          <div className={`
            absolute w-2 h-2 bg-gray-900 transform rotate-45 border border-gray-700
            ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-0 border-l-0' : ''}
            ${position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2 border-b-0 border-r-0' : ''}
            ${position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2 border-l-0 border-b-0' : ''}
            ${position === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2 border-r-0 border-t-0' : ''}
          `} />
        </div>
      )}
    </div>
  );
};

// Pre-configured tooltip components
export const BalanceTooltip = ({ children }: { children: React.ReactNode }) => (
  <Tooltip 
    text="Your current VOTE token balance. Earn tokens by voting and creating polls."
    position="bottom"
    width="medium"
  >
    {children}
  </Tooltip>
);

export const RewardTooltip = ({ children }: { children: React.ReactNode }) => (
  <Tooltip 
    text="Create 10 polls to earn 10,000 VOTE reward! Track your progress here."
    position="bottom"
    width="medium"
  >
    {children}
  </Tooltip>
);

export default Tooltip;