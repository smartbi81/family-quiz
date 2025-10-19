
import React from 'react';
import { useGame } from '../hooks/useGame';
import ScreenContainer from './ScreenContainer';
import SoundButton from './SoundButton';

const EndScreen: React.FC = () => {
    const { gameState, dispatch } = useGame();
    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);

    const podium = [sortedPlayers[1], sortedPlayers[0], sortedPlayers[2]].filter(Boolean);
    const podiumStyles = [
        { height: 'h-40', color: 'bg-slate-400', label: 'מקום 2' },
        { height: 'h-56', color: 'bg-yellow-400', label: '🏆 מקום 1 🏆' },
        { height: 'h-32', color: 'bg-yellow-600', label: 'מקום 3' },
    ];

    return (
        <ScreenContainer className="text-center">
            <h1 className="text-5xl font-bold mb-8 slide-in-up">המשחק נגמר!</h1>
            <div className="flex justify-center items-end gap-4">
                {podium.map((player, index) => (
                    <div key={player.user.id} className="flex flex-col items-center slide-in-up" style={{ animationDelay: `${(index + 1) * 200}ms` }}>
                        <span className="text-5xl">{player.user.avatar}</span>
                        <span className="text-xl font-bold">{player.user.name}</span>
                        <span className="text-lg text-green-300">{player.score} נק'</span>
                        <div className={`w-32 md:w-40 rounded-t-lg flex items-center justify-center text-xl font-bold text-gray-900 ${podiumStyles[index].height} ${podiumStyles[index].color}`}>
                            {podiumStyles[index].label}
                        </div>
                    </div>
                ))}
            </div>
            
            <SoundButton
                onClick={() => dispatch({ type: 'RESET' })}
                className="mt-12 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-2xl transition-transform transform hover:scale-105"
            >
                שחקו שוב
            </SoundButton>
        </ScreenContainer>
    );
};

export default EndScreen;