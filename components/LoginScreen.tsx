import React, { useState } from 'react';
import { USERS } from '../constants';
import { User } from '../types';
import { useGame } from '../hooks/useGame';
import PasswordModal from './PasswordModal';
import ScreenContainer from './ScreenContainer';
import SoundButton from './SoundButton';

const LoginScreen: React.FC = () => {
    const { dispatch } = useGame();
    const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);

    const handleUserSelect = (user: User) => {
        if (user.isAdmin) {
            setSelectedAdmin(user);
        } else {
            // Non-admins join a lobby directly. They can't create one.
            // The LOGIN reducer already sets the status to 'lobby' for them.
            dispatch({ type: 'LOGIN', payload: user });
        }
    };
    
    const handlePasswordSuccess = (user: User) => {
        dispatch({ type: 'LOGIN', payload: user });
        setSelectedAdmin(null);
    };

    return (
        <ScreenContainer>
            <h1 className="text-4xl md:text-6xl font-bold text-center mb-2 slide-in-up">מי רוצה לשחק?</h1>
            <p className="text-center text-lg text-gray-300 mb-8 slide-in-up" style={{animationDelay: '0.2s'}}>בחרו את הדמות שלכם כדי להתחיל</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {USERS.map((user, index) => (
                    <div key={user.id} className="slide-in-up" style={{animationDelay: `${0.4 + index * 0.1}s`}}>
                        <SoundButton
                            onClick={() => handleUserSelect(user)}
                            className="w-full flex flex-col items-center justify-center p-4 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 transform hover:-translate-y-1 transition-all duration-300 aspect-square"
                        >
                            <span className="text-5xl md:text-7xl mb-2">{user.avatar}</span>
                            <span className="text-xl md:text-2xl font-bold">{user.name}</span>
                        </SoundButton>
                    </div>
                ))}
            </div>
            {selectedAdmin && (
                <PasswordModal
                    user={selectedAdmin}
                    onClose={() => setSelectedAdmin(null)}
                    onSuccess={handlePasswordSuccess}
                />
            )}
        </ScreenContainer>
    );
};

export default LoginScreen;