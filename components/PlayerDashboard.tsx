import React from 'react';
import { useGame } from '../hooks/useGame';
import ScreenContainer from './ScreenContainer';
import SoundButton from './SoundButton';

const PlayerDashboard: React.FC = () => {
    const { gameState, dispatch } = useGame();
    const { currentUser, quiz: activeQuiz } = gameState;

    if (!currentUser) return null; // Should not happen

    const handleJoinGame = () => {
        dispatch({ type: 'JOIN_LOBBY', payload: currentUser });
        dispatch({ type: 'SET_STATUS', payload: 'lobby' });
    };

    return (
        <ScreenContainer>
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
                שלום, {currentUser.name}! {currentUser.avatar}
            </h1>

            {activeQuiz && activeQuiz.hostId ? (
                <div className="text-center">
                    <p className="text-2xl text-gray-300 mb-8">
                        אבא או אמא התחילו משחק חדש!
                    </p>
                    <div className="bg-black/30 p-6 rounded-lg mb-8 slide-in-up">
                        <h2 className="text-3xl font-bold">{activeQuiz.title}</h2>
                        <p className="text-lg text-gray-400 mt-2">{activeQuiz.questions.length} שאלות</p>
                    </div>
                    <SoundButton
                        onClick={handleJoinGame}
                        className="w-full max-w-md mx-auto px-8 py-5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-2xl transition-transform transform hover:scale-105 slide-in-up"
                        style={{animationDelay: '0.2s'}}
                    >
                        🎉 הצטרפות למשחק
                    </SoundButton>
                </div>
            ) : (
                <div className="text-center">
                    <p className="text-2xl text-gray-300 mb-8">
                        אין כרגע משחק פעיל.
                    </p>
                    <p className="text-lg text-gray-400">
                        בקשו מאבא או אמא להתחיל שאלון חדש כדי שתוכלו להצטרף!
                    </p>
                </div>
            )}
             <SoundButton
                onClick={() => dispatch({ type: 'LOGOUT'})}
                className="absolute top-4 left-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm"
            >
                התנתקות
            </SoundButton>
        </ScreenContainer>
    );
};

export default PlayerDashboard;