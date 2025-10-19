import React, { useState, useEffect } from 'react';
import { useGame } from '../hooks/useGame';
import ScreenContainer from './ScreenContainer';
import { database } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { Quiz } from '../types';
import SoundButton from './SoundButton';

const AdminDashboard: React.FC = () => {
    const { dispatch, gameState } = useGame();
    const { quiz: activeQuiz, currentUser } = gameState;
    const [savedQuizzes, setSavedQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const quizzesRef = ref(database, 'quizzes');
        const unsubscribe = onValue(quizzesRef, (snapshot) => {
            const data = snapshot.val();
            const quizList: Quiz[] = data ? Object.values(data) : [];
            setSavedQuizzes(quizList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleHostQuiz = (quizToHost: Quiz) => {
        dispatch({ type: 'CREATE_QUIZ', payload: quizToHost });
    };

    if (activeQuiz) {
        return (
            <ScreenContainer>
                <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
                    משחק "{activeQuiz.title}" פעיל כרגע!
                </h1>
                <p className="text-center text-lg text-gray-300 mb-8">מה תרצו לעשות?</p>
                <div className="flex flex-col md:flex-row gap-6 justify-center">
                    <SoundButton
                        onClick={() => dispatch({ type: 'SET_STATUS', payload: 'lobby' })}
                        className="px-8 py-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-2xl transition-transform transform hover:scale-105"
                    >
                        🚪 חזרה למשחק
                    </SoundButton>
                    <SoundButton
                        onClick={() => dispatch({ type: 'RESET' })}
                        className="px-8 py-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-2xl transition-transform transform hover:scale-105"
                    >
                        ❌ סיום המשחק הנוכחי
                    </SoundButton>
                </div>
                 <SoundButton
                    onClick={() => dispatch({ type: 'LOGOUT'})}
                    className="absolute top-4 left-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg text-sm"
                >
                    התנתקות
                </SoundButton>
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer className="max-h-screen flex flex-col">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
                שלום, {currentUser?.name}! בחרו שאלון או צרו חדש
            </h1>

            <div className="flex-grow overflow-y-auto bg-black/20 p-4 rounded-lg mb-6">
                <h2 className="text-2xl font-bold mb-4">שאלונים שמורים</h2>
                {loading ? (
                    <p>טוען שאלונים...</p>
                ) : savedQuizzes.length > 0 ? (
                    <div className="space-y-3">
                        {savedQuizzes.map((quiz) => (
                            <div key={quiz.id} className="bg-white/10 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold">{quiz.title}</h3>
                                    <p className="text-sm text-gray-400">{quiz.questions.length} שאלות</p>
                                </div>
                                <SoundButton
                                    onClick={() => handleHostQuiz(quiz)}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 font-bold rounded-lg transition-transform transform hover:scale-105"
                                >
                                    🚀 הפעלת משחק
                                </SoundButton>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-400 py-8">עדיין לא יצרתם שאלונים. לחצו על "יצירת שאלון חדש" כדי להתחיל!</p>
                )}
            </div>

            <SoundButton
                onClick={() => dispatch({ type: 'SET_STATUS', payload: 'creating-quiz' })}
                className="w-full px-8 py-5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-2xl transition-transform transform hover:scale-105"
            >
                📝 יצירת שאלון חדש
            </SoundButton>
             <SoundButton
                onClick={() => dispatch({ type: 'LOGOUT'})}
                className="absolute top-4 left-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg text-sm"
            >
                התנתקות
            </SoundButton>
        </ScreenContainer>
    );
};

export default AdminDashboard;