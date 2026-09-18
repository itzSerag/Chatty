import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client'

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "https://realtime-mern-chatty-backend.vercel.app";


interface ILoginData {
    email: string;
    password: string;
}

interface ISignupData extends ILoginData {
    phoneNumber: string;
}

interface IAuthUser {
    _id?: string;
    id?: string;
    email: string;
    username?: string;
    phoneNumber?: string;
    imgUrl?: string;
    profileImg?: string;
}

const normalizeUser = (user: any): IAuthUser | null => {
    if (!user) return null;
    return {
        ...user,
        _id: user._id || user.id,
        id: user.id || user._id,
        imgUrl: user.imgUrl || user.profileImg || null,
        profileImg: user.profileImg || user.imgUrl || null,
    };
};

interface IAuthStore {
    authUser: IAuthUser | null;
    isSigningUp: boolean;
    isLoggingIn: boolean;
    isUpdatingProfile: boolean;
    isCheckingAuth: boolean;
    onlineUsers: any[];
    socket: any;

    checkAuth: () => Promise<void>;
    login: (data: ILoginData) => Promise<void>;
    signup: (data: ISignupData) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: string) => Promise<void>;
    connectSocket: () => Promise<void>;
    dsiConnectSocket: () => Promise<void>;
}

export const useAuthStore = create<IAuthStore>((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get('/auth/user');
            set({ authUser: normalizeUser(res.data) });

            get().connectSocket()
        } catch (err) {
            console.log('User not authenticated:', err);
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    login: async (data: ILoginData) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post('/auth/login', data);
            set({ authUser: normalizeUser(res.data) });
            toast.success('Login Success');

            // Connect to the socket after login
            get().connectSocket();

        } catch (err: any) {
            if (err.response) {
                if (err.response.status === 401 || err.response.status === 404) {
                    toast.error('Invalid Credentials');
                } else {
                    toast.error('Login Failed, please try again later');
                }
            } else if (err.request) {
                toast.error('Network Error: Please check your internet connection');
            } else {
                toast.error('An unexpected error occurred');
            }
            console.log(err);
        } finally {
            set({ isLoggingIn: false });
        }
    },

    signup: async (data: ISignupData) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post('/auth/signup', data);
            set({ authUser: normalizeUser(res.data) });
            toast.success('Account Created');
        } catch (err: any) {
            if (err.response) {
                const { status, data } = err.response;
                if (status === 409) {
                    const errorMessage = data.message || 'This email or phone number already exists';
                    toast.error(errorMessage);
                } else {
                    toast.error('Signup Failed, please try again later');
                }
            } else if (err.request) {
                toast.error('Network Error: Please check your internet connection');
            } else {
                toast.error('An unexpected error occurred');
            }
            console.log(err);
        } finally {
            set({ isSigningUp: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post('/auth/logout');
            set({ authUser: null });
            toast.success('Logout Successful');
            get().dsiConnectSocket();
            window.location.reload();
            window.location.href = '/';
        } catch (err) {
            toast.error('Error happened while logging out');
            console.log(err);
        }
    },

    updateProfile: async (data: string) => {
        set({ isUpdatingProfile: true });
        try {
            const res = await axiosInstance.patch('/users/profile/updateImg', data);
            set({ authUser: normalizeUser(res.data) });
            toast.success('Profile updated successfully');
        } catch (err: any) {
            if (err.response.status === 413) {
                toast.error('File is too large, max is 5MB');
            } else {
                toast.error('Something went wrong, please try again later');
            }
        } finally {
            set({ isUpdatingProfile: false });
        }
    },

    connectSocket: async () => {
        // If the user not auth or socket already exists & connected then dont make a connection
        const { authUser } = get();
        const userId = authUser?._id || authUser?.id;
        if (!userId || get().socket?.connected) return;

        const socket = io(BASE_URL, {
            query: {
                userId
            }
        });
        set({ socket });

        socket.on('connect', () => {
            set({ socket });
        });

        socket.on('getOnlineUsers', (usersIds) => {
            set({ onlineUsers: usersIds });
            console.log(usersIds);
        });
    },
    dsiConnectSocket: async () => {
        // Implement socket disconnection logic here
        if (get().socket?.connected) {
            get().socket.disconnect();
        }

    },
}));