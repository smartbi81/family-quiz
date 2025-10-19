
import React from 'react';

interface ScreenContainerProps {
    children: React.ReactNode;
    className?: string;
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({ children, className = '' }) => {
    return (
        <div className={`w-full max-w-4xl mx-auto p-4 md:p-8 bg-black bg-opacity-20 rounded-2xl shadow-2xl backdrop-blur-sm border border-white/10 ${className}`}>
            {children}
        </div>
    );
};

export default ScreenContainer;
