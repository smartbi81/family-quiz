import React from 'react';
import { useGame } from '../hooks/useGame';
import ScreenContainer from './ScreenContainer';

const QuizCreationChoice: React.FC = () => {
    const { dispatch } = useGame();

    return (
        <ScreenContainer>
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-8">
                איך תרצו ליצור את השאלון?
            </h1>
            <div className="flex flex-col md:flex-row gap-6 justify-center">
                <button
                    onClick={() => dispatch({ type: 'SET_STATUS', payload: 'creating-quiz' })}
                    className="px-8 py-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-2xl transition-transform transform hover:scale-105 flex flex-col items-center"
                >
                    <span className="text-4xl mb-2">✍️</span>
                    יצירה ידנית
                </button>
                <button
                    onClick={() => dispatch({ type: 'SET_STATUS', payload: 'creating-quiz' })}
                    className="px-8 py-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-2xl transition-transform transform hover:scale-105 flex flex-col items-center"
                >
                    <span className="text-4xl mb-2">🤖</span>
                     יצירה אוטומטית עם AI
                </button>
            </div>
            <button
                onClick={() => dispatch({ type: 'SET_STATUS', payload: 'admin-dashboard' })}
                className="absolute top-4 left-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg text-sm"
            >
                חזרה
            </button>
        </ScreenContainer>
    );
};

export default QuizCreationChoice;
