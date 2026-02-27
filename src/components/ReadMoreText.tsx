'use client';

import { useState } from 'react';

interface ReadMoreTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export default function ReadMoreText({ text, maxLength = 100, className = '' }: ReadMoreTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Si el texto es más corto que maxLength, no necesitamos el botón
  if (text.length <= maxLength) {
    return <p className={className}>{text}</p>;
  }

  const truncatedText = text.slice(0, maxLength);
  const displayText = isExpanded ? text : truncatedText + '...';

  return (
    <div>
      <p className={className}>
        {displayText}
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="text-[#85ea10] hover:text-[#7dd30f] text-sm font-medium mt-1 transition-colors"
      >
        {isExpanded ? 'Leer menos' : 'Leer más'}
      </button>
    </div>
  );
}
