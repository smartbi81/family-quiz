export interface User {
    id: string;
    name: string;
    avatar: string;
    isAdmin: boolean;
}

export interface Answer {
    text: string;
    isCorrect: boolean;
}

export interface Question {
    question: string;
    answers: Answer[];
    timeLimit: number;
}

export interface Quiz {
    id: string;
    title: string;
    questions: Question[];
    hostId: string | null;
}

export interface Player {
    user: User;
    score: number;
    hasAnswered: boolean;
}

export interface PlayerAnswer {
    playerId: string;
    questionIndex: number;
    answerIndex: number;
    timeTaken: number;
    isCorrect: boolean;
}

export type GameStatus =
    | 'login'
    | 'admin-dashboard'
    | 'player-dashboard'
    | 'quiz-creation-choice'
    | 'creating-quiz'
    | 'lobby'
    | 'question-intro'
    | 'question-active'
    | 'question-results'
    | 'leaderboard'
    | 'end';

export interface GameState {
    gameStatus: GameStatus;
    currentUser: User | null;
    quiz: Quiz | null;
    players: Player[];
    currentQuestionIndex: number;
    answers: PlayerAnswer[]; // This is the local representation AFTER processing from Firebase
}

// Type for state as it comes from Firebase, where 'answers' is an object
export interface FirebaseGameState extends Omit<GameState, 'answers'> {
    answers?: Record<string, PlayerAnswer>;
}


export type Action =
    | { type: 'LOGIN'; payload: User }
    | { type: 'LOGOUT' }
    | { type: 'RESET' }
    | { type: 'SET_STATUS'; payload: GameStatus }
    | { type: 'CREATE_QUIZ'; payload: Quiz }
    | { type: 'JOIN_LOBBY'; payload: User }
    | { type: 'START_GAME' }
    | { type: 'NEXT_QUESTION' }
    | { type: 'END_GAME' }
    | { type: 'SHOW_QUESTION_RESULTS' }
    | { type: 'SUBMIT_ANSWER'; payload: { playerId: string; answerIndex: number; timeTaken: number } }
    | { type: 'SYNC_STATE'; payload: FirebaseGameState | null };