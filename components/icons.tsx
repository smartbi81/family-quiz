
import React from 'react';

export const TriangleIcon = () => (
    <svg viewBox="0 0 100 100" className="w-8 h-8" fill="white">
        <polygon points="50,15 100,85 0,85" />
    </svg>
);

export const DiamondIcon = () => (
    <svg viewBox="0 0 100 100" className="w-8 h-8" fill="white">
        <polygon points="50,0 100,50 50,100 0,50" />
    </svg>
);

export const CircleIcon = () => (
    <svg viewBox="0 0 100 100" className="w-8 h-8" fill="white">
        <circle cx="50" cy="50" r="45" />
    </svg>
);

export const SquareIcon = () => (
    <svg viewBox="0 0 100 100" className="w-8 h-8" fill="white">
        <rect width="90" height="90" x="5" y="5" />
    </svg>
);
