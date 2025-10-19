import React from 'react';
import { useGame } from '../hooks/useGame';
import ScreenContainer from './ScreenContainer';
import SoundButton from './SoundButton';

const LobbyScreen: React.FC = () => {
    const { gameState, dispatch } = useGame();
    const { currentUser, quiz, players } = gameState;
    
    if (!quiz || !currentUser) {
        return (
            <ScreenContainer className="text-center">
                <h1 className="text-3xl font-bold mb-4">המשחק לא נמצא</h1>
                <p className="text-lg text-gray-300">לא נמצא משחק פעיל. חזרו למסך הראשי.</p>
                 <SoundButton onClick={() => dispatch({ type: 'RESET' })} className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold">
                    חזרה
                </SoundButton>
            </ScreenContainer>
        );
    }

    const isHost = quiz.hostId === currentUser.id;

    return (
        <ScreenContainer className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">{quiz.title}</h1>
            <p className="text-xl text-gray-300 mb-8">המשחק יתחיל בקרוב!</p>
            
            <div className="bg-black/20 p-6 rounded-lg min-h-[200px]">
                <h2 className="text-2xl font-bold mb-4">משתתפים ({players.length})</h2>
                <div className="flex flex-wrap justify-center gap-4">
                    {players.map(player => (
                        <div key={player.user.id} className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full text-lg font-bold">
                            {quiz.hostId === player.user.id && <span title="מנהל המשחק">👑</span>}
                            <span className="text-2xl">{player.user.avatar}</span>
                            <span>{player.user.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {isHost ? (
                <SoundButton
                    onClick={() => dispatch({ type: 'START_GAME' })}
                    disabled={players.length < 2}
                    className="mt-8 px-12 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-3xl transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none"
                >
                    🚀 התחלת המשחק
                </SoundButton>
            ) : (
                <p className="mt-8 text-2xl text-yellow-300 animate-pulse">ממתינים למנהל/ת המשחק שיתחיל...</p>
            )}
            <SoundButton
                onClick={() => dispatch({ type: 'LOGOUT'})}
                className="absolute top-4 left-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm"
            >
                יציאה
            </SoundButton>
        </ScreenContainer>
    );
};

export default LobbyScreen;