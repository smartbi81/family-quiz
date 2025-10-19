
import React, { createContext, useReducer, ReactNode, Dispatch, useEffect } from 'react';
import { GameState, Action, User, PlayerAnswer, Quiz, GameStatus, Player } from '../types';
import { database } from '../firebase';
import { ref, set, onValue, update, push, runTransaction } from 'firebase/database';

const gameRef = ref(database, 'active-game');

const initialState: GameState = {
    gameStatus: 'login',
    currentUser: null,
    quiz: null,
    players: [],
    currentQuestionIndex: 0,
    answers: [],
};

const gameReducer = (state: GameState, action: Action): GameState => {
    switch (action.type) {
        case 'LOGIN':
            const user = action.payload;
            const gameStatus = user.isAdmin ? 'admin-dashboard' : 'player-dashboard';
            return { ...state, currentUser: user, gameStatus };
        
        case 'LOGOUT':
            if (!state.currentUser) return state;
            const userId = state.currentUser.id;
             // If a game is active, remove player from it transactionally
            if(state.quiz) {
                const playersRef = ref(database, 'active-game/players');
                runTransaction(playersRef, (currentPlayers) => {
                    if (!currentPlayers) return [];
                    return currentPlayers.filter(p => p.user.id !== userId);
                });
            }
            // Locally, log out immediately.
            return { ...initialState, currentUser: null, gameStatus: 'login' };

        case 'RESET':
            set(gameRef, null); // Clear the active game from Firebase
            return { ...initialState, currentUser: state.currentUser, gameStatus: state.currentUser?.isAdmin ? 'admin-dashboard' : 'player-dashboard' };
        
        case 'SET_STATUS':
             if (state.quiz) {
                set(ref(database, 'active-game/gameStatus'), action.payload);
             }
             // Let sync handle state change
             return { ...state, gameStatus: action.payload };
        
        case 'CREATE_QUIZ': {
            const quiz = action.payload;
            if (!state.currentUser || !state.currentUser.isAdmin) return state;
            quiz.hostId = state.currentUser.id;
            const hostPlayer = { user: state.currentUser, score: 0, hasAnswered: false };
            
            // We need to define the full structure for Firebase, but without currentUser.
            const firebaseState: Omit<GameState, 'currentUser'> = {
                quiz,
                gameStatus: 'lobby',
                players: [hostPlayer],
                currentQuestionIndex: 0,
                answers: [],
            };

            set(gameRef, firebaseState);
            // Optimistically update local state to avoid delay, sync will confirm it.
            return { ...firebaseState, currentUser: state.currentUser };
        }
        case 'JOIN_LOBBY': {
            const userToJoin = action.payload;
            const playersRef = ref(database, 'active-game/players');
            runTransaction(playersRef, (currentPlayers) => {
                if (!currentPlayers) {
                     return [{ user: userToJoin, score: 0, hasAnswered: false }];
                }
                if (currentPlayers.some(p => p.user.id === userToJoin.id)) {
                    return; // Abort transaction, already joined
                }
                currentPlayers.push({ user: userToJoin, score: 0, hasAnswered: false });
                return currentPlayers;
            });
            return state; // Let sync handle the update
        }
        case 'START_GAME':
            update(ref(database, 'active-game'), {
                gameStatus: 'question-intro',
                currentQuestionIndex: 0,
                answers: null, // Clear answers by setting to null
            });
            return state;
        
        case 'NEXT_QUESTION': {
            if (!state.quiz) return state;
            const nextQuestionIndex = state.currentQuestionIndex + 1;
            if (nextQuestionIndex >= state.quiz.questions.length) {
                set(ref(database, 'active-game/gameStatus'), 'end');
                return state;
            }
            const playersWithResetAnswerStatus = state.players.map(p => ({ ...p, hasAnswered: false }));
            update(ref(database, 'active-game'), {
                gameStatus: 'question-intro',
                currentQuestionIndex: nextQuestionIndex,
                players: playersWithResetAnswerStatus,
                answers: null, // Clear answers for the new question
            });
            return state;
        }
        case 'END_GAME':
             set(ref(database, 'active-game/gameStatus'), 'end');
             return state;

        case 'SHOW_QUESTION_RESULTS': {
            if (state.gameStatus !== 'question-active' || !state.quiz) return state;
            const question = state.quiz.questions[state.currentQuestionIndex];
            if (!question) return state;

            const currentQuestionAnswers = state.answers.filter(a => a.questionIndex === state.currentQuestionIndex);
            
            const updatedPlayers = state.players.map(player => {
                const playerAnswer = currentQuestionAnswers.find(a => a.playerId === player.user.id);
                if (playerAnswer && playerAnswer.isCorrect) {
                    const points = Math.round(Math.max(0, (1 - (playerAnswer.timeTaken / question.timeLimit))) * 1000);
                    return { ...player, score: player.score + points };
                }
                return player;
            });
            
            update(ref(database, 'active-game'), {
                gameStatus: 'question-results',
                players: updatedPlayers,
            });
            return state;
        }

        case 'SUBMIT_ANSWER': {
            const { playerId, answerIndex, timeTaken } = action.payload;

            runTransaction(gameRef, (currentGameState) => {
                // If game doesn't exist on server, abort.
                if (!currentGameState) {
                    return;
                }
                
                // Deep copy to prevent modifying cached state.
                const nextState = JSON.parse(JSON.stringify(currentGameState)); 
                const { players, currentQuestionIndex, quiz, gameStatus } = nextState;

                // Only process answers during the active question phase.
                if (gameStatus !== 'question-active' || !quiz || !players) {
                    return currentGameState; // Return original state, no changes.
                }

                // Check if player has already answered.
                const playerIndex = players.findIndex((p: Player) => p.user.id === playerId);
                if (playerIndex === -1 || players[playerIndex].hasAnswered) {
                    return; // Abort transaction.
                }
                
                // 1. Record the Answer
                const question = quiz.questions[currentQuestionIndex];
                const isCorrect = question.answers[answerIndex].isCorrect;
                // *** THE FIX IS HERE ***
                // Use `currentQuestionIndex` from the transaction's state, not an undefined variable.
                const newAnswer: PlayerAnswer = { playerId, questionIndex: currentQuestionIndex, answerIndex, timeTaken, isCorrect };

                if (!nextState.answers) {
                    nextState.answers = {};
                }
                // Use a non-conflicting key for the answer.
                const answerKey = `${currentQuestionIndex}-${playerId}`;
                nextState.answers[answerKey] = newAnswer;
                
                // 2. Update Player's Status
                nextState.players[playerIndex].hasAnswered = true;

                // 3. Check for Game State Transition (if all players answered)
                const allPlayersAnswered = nextState.players.every((p: Player) => p.hasAnswered);

                if (allPlayersAnswered) {
                    // 4. ATOMICALLY transition to results
                    nextState.gameStatus = 'question-results';
                    
                    const currentQuestionAnswers = Object.values(nextState.answers).filter(a => (a as PlayerAnswer).questionIndex === currentQuestionIndex) as PlayerAnswer[];
                    
                    const scoredPlayers = nextState.players.map((p: Player) => {
                        const playerAnswer = currentQuestionAnswers.find(a => a.playerId === p.user.id);
                        if (playerAnswer && playerAnswer.isCorrect) {
                            const points = Math.round(Math.max(0, (1 - (playerAnswer.timeTaken / question.timeLimit))) * 1000);
                            return { ...p, score: p.score + points };
                        }
                        return p;
                    });
                    nextState.players = scoredPlayers;
                }

                return nextState; // Return the fully updated state.
            });

            return state; // Local state will be updated by the Firebase listener.
        }

        case 'SYNC_STATE': {
            const remoteState = action.payload;

            // Case 1: The game has been cleared from the database. Reset to a safe dashboard state.
            if (!remoteState) {
                const isAdmin = state.currentUser?.isAdmin;
                return { ...initialState, currentUser: state.currentUser, gameStatus: isAdmin ? 'admin-dashboard' : 'player-dashboard' };
            }
            
            // --- The Definitive Fix ---
            // Define all game statuses that absolutely require a quiz object to function.
            const quizRequiredStatuses: GameStatus[] = [
                'lobby',
                'question-intro',
                'question-active',
                'question-results',
                'leaderboard',
                'end'
            ];

            const quizIsRequired = quizRequiredStatuses.includes(remoteState.gameStatus);

            // The "Golden Rule": If the game status requires a quiz, but the quiz data is missing from
            // the server update, then the state is corrupt. Do not accept it. Fail gracefully.
            if (quizIsRequired && !remoteState.quiz) {
                console.error("CRITICAL: In-game state received from Firebase without a quiz object. This is an impossible state. Resetting client to prevent a crash.", remoteState);
                const isAdmin = state.currentUser?.isAdmin;
                return { ...initialState, currentUser: state.currentUser, gameStatus: isAdmin ? 'admin-dashboard' : 'player-dashboard' };
            }
            // --- End of Fix ---

            const answersArray = remoteState.answers ? Object.values(remoteState.answers) as PlayerAnswer[] : [];
            
            // If the state is valid, construct the new state directly from the server's data.
            // This avoids complex merging logic and ensures the client reflects the true state of the game.
            return {
                currentUser: state.currentUser, // Always preserve the locally logged-in user.
                quiz: remoteState.quiz || null,
                gameStatus: remoteState.gameStatus || 'login',
                players: remoteState.players || [],
                currentQuestionIndex: remoteState.currentQuestionIndex ?? 0,
                answers: answersArray,
            };
        }

        default:
            return state;
    }
};

interface GameContextType {
    gameState: GameState;
    dispatch: Dispatch<Action>;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
    const [gameState, dispatch] = useReducer(gameReducer, initialState);

    useEffect(() => {
        const unsubscribe = onValue(gameRef, (snapshot) => {
            const data: Omit<GameState, 'currentUser' | 'answers'> & { answers: Record<string, PlayerAnswer> } | null = snapshot.val();
            dispatch({ type: 'SYNC_STATE', payload: data as any });
        });
        return () => unsubscribe();
    }, []);

    return (
        <GameContext.Provider value={{ gameState, dispatch }}>
            {children}
        </GameContext.Provider>
    );
};
