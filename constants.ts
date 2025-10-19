import { User } from './types';

export const USERS: User[] = [
    { id: 'aba', name: 'אבא', avatar: '👨‍👧‍👦', isAdmin: true },
    { id: 'ima', name: 'אמא', avatar: '👩‍👧‍👦', isAdmin: true },
    { id: 'manor', name: 'מנור', avatar: '👧', isAdmin: false },
    { id: 'danaor', name: 'דנאור', avatar: '👦', isAdmin: false },
];

export const PASSWORDS: { [key: string]: string } = {
    aba: '1511',
    ima: '0406',
};

export const ANSWER_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];
export const ANSWER_HOVER_COLORS = ['hover:bg-red-600', 'hover:bg-blue-600', 'hover:bg-yellow-600', 'hover:bg-green-600'];