
import React, { useState } from 'react';
import { User } from '../types';
import { PASSWORDS } from '../constants';
import SoundButton from './SoundButton';

interface PasswordModalProps {
    user: User;
    onClose: () => void;
    onSuccess: (user: User) => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ user, onClose, onSuccess }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (PASSWORDS[user.id] === password) {
            onSuccess(user);
        } else {
            setError('סיסמא שגויה, נסו שוב!');
            setPassword('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 fade-in">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-sm border border-white/20 slide-in-up">
                <div className="text-center mb-6">
                    <span className="text-6xl">{user.avatar}</span>
                    <h2 className="text-3xl font-bold mt-2">שלום, {user.name}!</h2>
                    <p className="text-gray-400">יש להזין סיסמא כדי להמשיך</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 text-center bg-gray-900 rounded-lg text-white text-2xl tracking-widest border-2 border-gray-700 focus:border-purple-500 focus:outline-none transition"
                        autoFocus
                    />
                    {error && <p className="text-red-400 text-center mt-3">{error}</p>}
                    <div className="flex gap-4 mt-6">
                         <SoundButton
                            type="button"
                            onClick={onClose}
                            className="w-full py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-bold transition-colors"
                        >
                            ביטול
                        </SoundButton>
                        <SoundButton
                            type="submit"
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition-colors"
                        >
                            כניסה
                        </SoundButton>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordModal;