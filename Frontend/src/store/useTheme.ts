import { create } from "zustand";


// zustand hook to create a theme
export const useThemeStore = create((set) => ({

    theme: localStorage.getItem('chat-theme') || 'light',
    setTheme: (theme) => {

        // save it in the localstorage
        localStorage.setItem('chat-theme', theme);
        set({ theme })
    }
}));