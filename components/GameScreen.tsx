

import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../hooks/useGame';
import { ANSWER_COLORS, ANSWER_HOVER_COLORS } from '../constants';
import { TriangleIcon, DiamondIcon, CircleIcon, SquareIcon } from './icons';
import { Player } from '../types';
import { useSounds } from '../hooks/useSounds';
import SoundButton from './SoundButton';

const AnswerShapes = [
    <TriangleIcon key={0} />,
    <DiamondIcon key={1} />,
    <CircleIcon key={2} />,
    <SquareIcon key={3} />,
];

// --- Timer Component ---
const Timer: React.FC<{ duration: number; onTimeUp: () => void }> = ({ duration, onTimeUp }) => {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeUp();
            return;
        }
        const interval = setInterval(() => {
            setTimeLeft(prev => prev - 0.1);
        }, 100);
        return () => clearInterval(interval);
    }, [timeLeft, onTimeUp]);
    
    const progress = (timeLeft / duration) * 100;

    return (
        <div className="relative w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
            <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#a855f7 ${progress}%, transparent 0)`}}></div>
            <div className="relative w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center text-3xl font-bold">
                {Math.ceil(timeLeft)}
            </div>
        </div>
    );
};

// --- Player Chip Component ---
const PlayerChip: React.FC<{ player: Player, animate: boolean }> = ({ player, animate }) => {
    return (
        <div className={`flex items-center gap-2 p-2 rounded-full bg-black/30 transition-all duration-500 ${animate ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
            <span className="text-2xl">{player.user.avatar}</span>
            <span className="font-bold">{player.user.name}</span>
            {player.hasAnswered && <span className="text-green-400 text-2xl">✓</span>}
        </div>
    );
};

// --- Main Game Screen Component ---
const GameScreen: React.FC = () => {
    const { gameState, dispatch } = useGame();
    const { currentUser, quiz, players, currentQuestionIndex, gameStatus } = gameState;
    const [startTime, setStartTime] = useState(0);
    const { playPop, playQuestionIntro, playTransition } = useSounds();

    const question = quiz?.questions[currentQuestionIndex];
    const isHost = quiz?.hostId === currentUser?.id;

    const handleTimeUp = useCallback(() => {
        // Only the host should advance the game state on time up to prevent race conditions.
        if (isHost && gameStatus === 'question-active') {
             dispatch({ type: 'SHOW_QUESTION_RESULTS' });
        }
    }, [gameStatus, dispatch, isHost]);

    // This effect handles sounds for ALL clients when game status changes.
    useEffect(() => {
        if (gameStatus === 'question-intro') {
            playQuestionIntro();
        }
    }, [gameStatus, playQuestionIntro, currentQuestionIndex]); // Add question index to replay sound on each new question

    // This effect handles local state changes for ALL clients when game status changes.
    useEffect(() => {
        if (gameStatus === 'question-active') {
            setStartTime(Date.now());
        }
    }, [gameStatus]);


    // This effect centralizes TIMER-BASED game flow logic to the HOST only.
    // The logic for transitioning after all players answer has been moved to an atomic transaction.
    useEffect(() => {
        // Only the host should be driving the game state forward with timers.
        if (!isHost) {
            return;
        }

        // --- Timer-based transitions ---
        if (gameStatus === 'question-intro') {
            const timer = setTimeout(() => {
                dispatch({ type: 'SET_STATUS', payload: 'question-active' });
            }, 3000);
            return () => clearTimeout(timer);
        }

        if (gameStatus === 'question-results') {
            const timer = setTimeout(() => {
                dispatch({ type: 'SET_STATUS', payload: 'leaderboard' });
            }, 7000);
            return () => clearTimeout(timer);
        }
    }, [gameStatus, isHost, dispatch]);


    const handleAnswer = (answerIndex: number) => {
        playPop();
        if (!currentUser) return;
        const timeTaken = (Date.now() - startTime) / 1000;
        dispatch({ type: 'SUBMIT_ANSWER', payload: { playerId: currentUser.id, answerIndex, timeTaken } });
    };

    const me = players.find(p => p.user.id === currentUser?.id);

    if (!question || !currentUser) return <div className="text-2xl">טוען...</div>;
    
    if (gameStatus === 'question-intro') {
        return (
            <div className="text-center fade-in">
                <p className="text-2xl mb-4">שאלה {currentQuestionIndex + 1}</p>
                <h1 className="text-5xl font-bold">{question.question}</h1>
            </div>
        );
    }
    
    if (gameStatus === 'question-results') {
        const currentQuestionAnswers = gameState.answers.filter(a => a.questionIndex === currentQuestionIndex);
        
        return (
            <div className="w-full max-w-5xl text-center fade-in">
                 {isHost && (
                    <SoundButton
                        onClick={() => dispatch({ type: 'END_GAME' })}
                        className="absolute top-4 left-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm z-10"
                    >
                        ❌ סיום משחק
                    </SoundButton>
                )}
                <h1 className="text-4xl font-bold mb-4">תוצאות השאלה</h1>
                <div className="bg-black/20 p-4 rounded-lg mb-4">
                    <h2 className="text-3xl font-bold">{question.question}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {question.answers.map((ans, i) => {
                        const playersWhoChoseThis = players.filter(p => 
                            currentQuestionAnswers.some(a => a.playerId === p.user.id && a.answerIndex === i)
                        );
                        const answerCount = playersWhoChoseThis.length;

                        return (
                            <div key={i} className={`p-3 rounded-lg flex flex-col justify-between transition-all duration-500 min-h-[100px] ${ans.isCorrect ? 'bg-green-600 shadow-lg scale-105' : 'bg-gray-800'}`}>
                                <div className="w-full flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 flex items-center justify-center bg-black/20 rounded-md">
                                            {AnswerShapes[i]}
                                        </div>
                                        <span className="text-xl font-bold">{ans.text}</span>
                                    </div>
                                    <span className="text-xl font-bold bg-white/20 px-3 py-1 rounded-full">{answerCount}</span>
                                </div>
                                <div className="w-full flex justify-start items-center h-10 mt-2">
                                    <div className="flex -space-x-3">
                                        {playersWhoChoseThis.map(p => (
                                            <div key={p.user.id} className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center border-2 border-white/50" title={p.user.name}>
                                                <span className="text-2xl">{p.user.avatar}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (gameStatus === 'leaderboard') {
        const sortedPlayers = [...players].sort((a,b) => b.score - a.score);

        return (
            <div className="w-full max-w-2xl text-center fade-in">
                {isHost && (
                    <SoundButton
                        onClick={() => dispatch({ type: 'END_GAME' })}
                        className="absolute top-4 left-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm z-10"
                    >
                        ❌ סיום משחק
                    </SoundButton>
                )}
                <h1 className="text-4xl font-bold mb-6">טבלת מובילים</h1>
                <div className="space-y-3">
                    {sortedPlayers.map((p, index) => (
                        <div key={p.user.id} className={`flex items-center justify-between p-4 rounded-lg slide-in-up bg-black/20 ${index === 0 ? 'border-2 border-yellow-400' : ''}`} style={{animationDelay: `${index * 100}ms`}}>
                           <div className="flex items-center gap-4">
                                <span className="text-2xl font-bold w-8">{index + 1}.</span>
                                <span className="text-3xl">{p.user.avatar}</span>
                                <span className="text-2xl font-bold">{p.user.name}</span>
                            </div>
                            <span className="text-2xl font-bold text-green-400">{p.score} נק'</span>
                        </div>
                    ))}
                </div>
                 {isHost && (
                    <button onClick={() => {
                        playTransition();
                        dispatch({type: 'NEXT_QUESTION'});
                    }} className="mt-8 px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold text-xl">
                        { quiz && currentQuestionIndex >= quiz.questions.length - 1 ? '🏆 סיום המשחק' : 'השאלה הבאה ←'}
                    </button>
                 )}
            </div>
        );
    }


    return (
        <div className="w-full h-full flex flex-col p-4 relative">
            {isHost && (
                <SoundButton
                    onClick={() => dispatch({ type: 'END_GAME' })}
                    className="absolute top-4 left-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm z-10"
                >
                    ❌ סיום משחק
                </SoundButton>
            )}
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="text-xl font-bold">שאלה {currentQuestionIndex + 1}/{quiz.questions.length}</div>
                {gameStatus === 'question-active' && <Timer duration={question.timeLimit} onTimeUp={handleTimeUp} />}
                <div className="text-xl font-bold">ניקוד: {me?.score || 0}</div>
            </div>

            {/* Question */}
            <div className="flex-grow flex items-center justify-center">
                <h2 className="text-2xl md:text-4xl font-bold text-center bg-black/30 p-6 rounded-lg shadow-lg">
                    {question.question}
                </h2>
            </div>
            
            {/* Answer section */}
             <div className="grid grid-cols-2 gap-3">
                {question.answers.map((answer, i) => {
                    const hasAnswered = me?.hasAnswered;
                    const isCorrect = answer.isCorrect;
                    const myChoice = gameState.answers.find(a => a.playerId === currentUser.id && a.questionIndex === currentQuestionIndex)?.answerIndex === i;

                    let buttonClass = `${ANSWER_COLORS[i]} ${ANSWER_HOVER_COLORS[i]} answer-btn-pop`;
                    if (hasAnswered) {
                        if (isCorrect) buttonClass = 'bg-green-500';
                        else if (myChoice) buttonClass = 'bg-red-700';
                        else buttonClass = 'bg-gray-700 opacity-50';
                    }

                    return (
                        <button
                            key={i}
                            disabled={me?.hasAnswered}
                            onClick={() => handleAnswer(i)}
                            className={`flex items-center justify-start gap-4 p-4 rounded-lg transition-all duration-300 ${buttonClass} disabled:cursor-not-allowed`}
                        >
                             <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-md">
                                {AnswerShapes[i]}
                            </div>
                            <span className="text-xl font-bold">{answer.text}</span>
                        </button>
                    );
                })}
            </div>

            {/* Answered Players Sidebar */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 space-y-2">
                {players.map((p) => (
                    <PlayerChip key={p.user.id} player={p} animate={p.hasAnswered} />
                ))}
            </div>
        </div>
    );
};

export default GameScreen;