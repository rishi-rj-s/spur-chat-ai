import { writable } from 'svelte/store';

export type Theme = 'glass-light' | 'glass-dark' | 'minimal-light' | 'minimal-dark';

export const theme = writable<Theme>('glass-light');

export const themes = {
    'glass-light': {
        name: 'Glass Light',
        bg: 'bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100',
        text: 'text-slate-800',
        header: 'bg-white/70 backdrop-blur-md border-b border-white/50',
        bubbleAi: 'bg-white/80 backdrop-blur-sm border border-white/50 text-slate-800',
        bubbleUser: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg',
        inputArea: 'bg-white/70 backdrop-blur-md border-t border-white/50',
        input: 'bg-white/50 focus:bg-white/80 transition-all border border-white/50 text-slate-800',
    },
    'glass-dark': {
        name: 'Glass Dark',
        bg: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900',
        text: 'text-slate-100',
        header: 'bg-slate-900/70 backdrop-blur-md border-b border-white/10',
        bubbleAi: 'bg-slate-800/80 backdrop-blur-sm border border-white/10 text-slate-100',
        bubbleUser: 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg',
        inputArea: 'bg-slate-900/70 backdrop-blur-md border-t border-white/10',
        input: 'bg-slate-800/50 focus:bg-slate-800/80 transition-all border border-white/10 text-slate-100',
    },
    'minimal-light': {
        name: 'Light',
        bg: 'bg-gray-50',
        text: 'text-gray-900',
        header: 'bg-white border-b border-gray-200',
        bubbleAi: 'bg-white border border-gray-100 text-gray-800',
        bubbleUser: 'bg-black text-white',
        inputArea: 'bg-white border-t border-gray-200',
        input: 'bg-gray-100 focus:bg-white text-gray-900',
    },
    'minimal-dark': {
        name: 'Dark',
        bg: 'bg-black',
        text: 'text-gray-100',
        header: 'bg-black border-b border-gray-800',
        bubbleAi: 'bg-gray-900 border border-gray-800 text-gray-100',
        bubbleUser: 'bg-white text-black',
        inputArea: 'bg-black border-t border-gray-800',
        input: 'bg-gray-900 focus:bg-gray-800 text-gray-100 border-gray-800',
    }
};
