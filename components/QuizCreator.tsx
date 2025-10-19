import React, { useState } from 'react';
import { Question, Quiz } from '../types';
import { useGame } from '../hooks/useGame';
import ScreenContainer from './ScreenContainer';
import { GoogleGenAI, Type } from "@google/genai";
import { database } from '../firebase';
import { ref, push, set } from 'firebase/database';
import SoundButton from './SoundButton';

const emptyQuestion: Question = {
    question: '',
    answers: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
    ],
    timeLimit: 15,
};

const QuizCreator: React.FC = () => {
    const { dispatch, gameState } = useGame();
    const { currentUser } = gameState;
    const [creationMode, setCreationMode] = useState('manual'); // 'manual' or 'auto'
    const [title, setTitle] = useState('');
    const [questions, setQuestions] = useState<Question[]>([{...emptyQuestion, answers: emptyQuestion.answers.map(a => ({...a}))}]);

    // State for auto-generation
    const [topic, setTopic] = useState('מדע');
    const [difficulty, setDifficulty] = useState('קל');
    const [numQuestions, setNumQuestions] = useState(5);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleQuestionChange = (index: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[index].question = value;
        setQuestions(newQuestions);
    };

    const handleAnswerChange = (qIndex: number, aIndex: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].answers[aIndex].text = value;
        setQuestions(newQuestions);
    };

    const handleCorrectAnswerChange = (qIndex: number, aIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].answers.forEach((ans, i) => ans.isCorrect = i === aIndex);
        setQuestions(newQuestions);
    };

    const addQuestion = () => {
        setQuestions([...questions, { ...emptyQuestion, answers: emptyQuestion.answers.map(a => ({...a})) }]);
    };
    
    const handleGenerateQuiz = async () => {
        setIsLoading(true);
        setError('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `צור שאלון עם ${numQuestions} שאלות בנושא ${topic} ברמת קושי ${difficulty} לתלמידי כיתות ד'-ו'.
            ודא שיש בדיוק 4 תשובות לכל שאלה, ורק אחת מהן מסומנת כנכונה.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: {
                                type: Type.STRING,
                                description: "כותרת קצרה וקליטה בעברית לשאלון."
                            },
                            questions: {
                                type: Type.ARRAY,
                                description: "מערך של שאלות השאלון.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        question: {
                                            type: Type.STRING,
                                            description: "טקסט השאלה בעברית."
                                        },
                                        answers: {
                                            type: Type.ARRAY,
                                            description: "מערך של 4 תשובות אפשריות.",
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    text: {
                                                        type: Type.STRING,
                                                        description: "טקסט התשובה בעברית."
                                                    },
                                                    isCorrect: {
                                                        type: Type.BOOLEAN,
                                                        description: "True אם זו התשובה הנכונה, אחרת false."
                                                    }
                                                },
                                                required: ['text', 'isCorrect']
                                            }
                                        },
                                        timeLimit: {
                                            type: Type.INTEGER,
                                            description: "מגבלת זמן בשניות לשאלה, יש להגדיר ל-15."
                                        }
                                    },
                                    required: ['question', 'answers', 'timeLimit']
                                }
                            }
                        },
                        required: ['title', 'questions']
                    },
                }
            });
            
            const generatedQuiz = JSON.parse(response.text);

            if (generatedQuiz.title && generatedQuiz.questions && Array.isArray(generatedQuiz.questions)) {
                setTitle(generatedQuiz.title);
                setQuestions(generatedQuiz.questions);
                setCreationMode('manual'); // Switch to editor view for review
            } else {
                throw new Error("פורמט ה-JSON שהתקבל אינו תקין.");
            }

        } catch (e) {
            console.error("Error generating quiz:", e);
            setError("אירעה שגיאה ביצירת השאלון. נסו שוב.");
        } finally {
            setIsLoading(false);
        }
    };


    const saveQuiz = () => {
        if (!title.trim() || questions.some(q => !q.question.trim() || q.answers.some(a => !a.text.trim()) || !q.answers.some(a => a.isCorrect))) {
            alert('נא למלא את כל השדות ולסמן תשובה נכונה לכל שאלה.');
            return;
        }
        
        const quizzesRef = ref(database, 'quizzes');
        const newQuizRef = push(quizzesRef);

        // FIX: Ensured new quiz conforms to the Quiz type by adding hostId: null.
        // This prevents type errors when quizzes are loaded from the database.
        const newQuiz: Quiz = {
            id: newQuizRef.key!,
            title,
            questions,
            hostId: null,
        }

        set(newQuizRef, newQuiz)
            .then(() => {
                dispatch({ type: 'SET_STATUS', payload: 'admin-dashboard' });
            })
            .catch((error) => {
                console.error("Error saving quiz:", error);
                alert("שגיאה בשמירת השאלון.");
            });
    };

    return (
        <ScreenContainer className="max-h-screen overflow-y-auto">
             {isLoading && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-500"></div>
                    <p className="text-2xl mt-4">הרובוט שלנו מכין לכם שאלון...</p>
                </div>
            )}
            <h1 className="text-4xl font-bold text-center mb-6">יצירת שאלון חדש</h1>
            
            <div className="flex justify-center mb-6 bg-gray-900/50 rounded-lg p-1">
                <SoundButton onClick={() => setCreationMode('manual')} className={`w-1/2 py-2 rounded-md font-bold ${creationMode === 'manual' ? 'bg-purple-600' : ''}`}>יצירה ידנית ✍️</SoundButton>
                <SoundButton onClick={() => setCreationMode('auto')} className={`w-1/2 py-2 rounded-md font-bold ${creationMode === 'auto' ? 'bg-purple-600' : ''}`}>יצירה אוטומטית 🤖</SoundButton>
            </div>

            {creationMode === 'auto' ? (
                 <div className="bg-white/10 p-6 rounded-lg">
                    <h2 className="text-2xl font-bold mb-4 text-center">יצירה אוטומטית עם AI</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-lg font-bold mb-1">נושא</label>
                            <select value={topic} onChange={e => setTopic(e.target.value)} className="w-full p-3 bg-gray-700 text-white rounded-lg">
                                <option>מדע</option>
                                <option>היסטוריה</option>
                                <option>גיאוגרפיה</option>
                                <option>מתמטיקה</option>
                                <option>אנגלית</option>
                                <option>ספורט</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-lg font-bold mb-1">רמת קושי</label>
                            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full p-3 bg-gray-700 text-white rounded-lg">
                                <option>קל</option>
                                <option>בינוני</option>
                                <option>קשה</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-lg font-bold mb-1">מספר שאלות</label>
                            <input type="number" value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))} min="3" max="15" className="w-full p-3 bg-gray-700 text-white rounded-lg" />
                        </div>
                    </div>
                    {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                    <SoundButton onClick={handleGenerateQuiz} disabled={isLoading} className="w-full mt-6 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-xl disabled:bg-gray-500">
                        {isLoading ? 'יוצר שאלון...' : '🚀 צור לי שאלון!'}
                    </SoundButton>
                </div>
            ) : (
                <>
                    <div className="mb-6">
                        <label className="block text-lg font-bold mb-2">כותרת השאלון</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-3 bg-gray-700 rounded-lg text-white"
                            placeholder="לדוגמא: כמה טוב אתם מכירים את המשפחה?"
                        />
                    </div>
                    {questions.map((q, qIndex) => (
                        <div key={qIndex} className="bg-white/10 p-4 rounded-lg mb-4">
                            <h3 className="text-xl font-bold mb-3">שאלה {qIndex + 1}</h3>
                            <textarea
                                value={q.question}
                                onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                                className="w-full p-2 bg-gray-700 rounded-lg mb-3 text-white"
                                placeholder="כתבו כאן את השאלה"
                                rows={2}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {q.answers.map((ans, aIndex) => (
                                    <div key={aIndex} className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name={`correct-answer-${qIndex}`}
                                            checked={ans.isCorrect}
                                            onChange={() => handleCorrectAnswerChange(qIndex, aIndex)}
                                            className="form-radio h-5 w-5 text-green-500 bg-gray-800 border-gray-600 focus:ring-green-500"
                                        />
                                        <input
                                            type="text"
                                            value={ans.text}
                                            onChange={(e) => handleAnswerChange(qIndex, aIndex, e.target.value)}
                                            className="w-full p-2 bg-gray-800 rounded-lg text-white"
                                            placeholder={`תשובה ${aIndex + 1}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-between mt-6">
                        <SoundButton onClick={addQuestion} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold">
                            + הוספת שאלה
                        </SoundButton>
                        <SoundButton onClick={saveQuiz} className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg">
                            ✅ שמירת השאלון
                        </SoundButton>
                    </div>
                </>
            )}
             <SoundButton
                onClick={() => dispatch({ type: 'SET_STATUS', payload: 'admin-dashboard'})}
                className="absolute top-4 left-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg text-sm"
            >
                חזרה
            </SoundButton>
        </ScreenContainer>
    );
};

export default QuizCreator;