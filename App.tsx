import React from 'react';
import { useGame } from './hooks/useGame';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import PlayerDashboard from './components/PlayerDashboard';
import QuizCreator from './components/QuizCreator';
import LobbyScreen from './components/LobbyScreen';
import GameScreen from './components/GameScreen';
import EndScreen from './components/EndScreen';

function App() {
  const { gameState } = useGame();
  const { gameStatus, currentUser } = gameState;

  const renderScreen = () => {
    if (!currentUser) {
      return <LoginScreen />;
    }

    switch (gameStatus) {
      case 'login':
        return <LoginScreen />;
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'player-dashboard':
        return <PlayerDashboard />;
      case 'creating-quiz':
        return <QuizCreator />;
      case 'lobby':
        return <LobbyScreen />;
      case 'question-intro':
      case 'question-active':
      case 'question-results':
      case 'leaderboard':
        return <GameScreen />;
      case 'end':
        return <EndScreen />;
      default:
        return <LoginScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 text-white flex items-center justify-center font-sans">
      <main className="w-full h-full flex items-center justify-center p-4">
        {renderScreen()}
      </main>
    </div>
  );
}

export default App;