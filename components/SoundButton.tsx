import React from 'react';
import { useSounds } from '../hooks/useSounds';

interface SoundButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const SoundButton: React.FC<SoundButtonProps> = ({ children, onClick, ...props }) => {
    const { playClick } = useSounds();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        playClick();
        if (onClick) onClick(e);
    };

    return (
        <button onClick={handleClick} {...props}>
            {children}
        </button>
    );
};

export default SoundButton;
