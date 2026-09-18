import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./user-auth.store";


interface IChatState {

    isUsersLoading: boolean,
    isMessagesLoading: boolean,

    selectedUser: any | null,
    messages: Array<unknown>;
    users: Array<unknown>

    sendMessage: (messageData: { text: string; imageBase64: any }) => Promise<void>;
    getUsers: () => void;
    getMessages: (userId: string) => void;
    setSelectedUser: (user: any) => void
    subscribeToMessages: () => void
    unSubscribeFromMessages: () => void
}

export const useChatStore = create<IChatState>((set, get) => ({

    messages: [],
    users: [],

    isMessagesLoading: false,
    isUsersLoading: false,
    selectedUser: null,
    getUsers: async () => {
        set({ isUsersLoading: true });
        try {
            // return an array of users from db
            const resUsers = await axiosInstance.get('users');
            set({ users: Array.isArray(resUsers.data) ? resUsers.data : [] });
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Something went wrong, Please try again later';
            toast.error(message);
            console.log('Error fetching users:', error);
        } finally {
            set({ isUsersLoading: false });
        }
    },

    sendMessage: async ({ text, imageBase64 }) => {
        try {
            const { selectedUser } = get();
            if (!selectedUser) return;
            const targetId = selectedUser._id || selectedUser.id;
            const res = await axiosInstance.post(`/message/send/${targetId}`, { text, imageBase64 });
            if (res.data) {
                set({
                    messages: [...get().messages, res.data]
                });
            }
        } catch (err: any) {
            const message = err?.response?.data?.message || 'Something went wrong, Please try again later';
            toast.error(message);
            console.log(err);
        }
    },

    getMessages: async (userId: string) => {
        set({ isMessagesLoading: true });

        try {
            const resMessages = await axiosInstance.get(`message/messages/${userId}`);
            set({ messages: Array.isArray(resMessages.data) ? resMessages.data : [] });
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Something went wrong, Please try again later';
            toast.error(message);
            console.log(error);
            set({ messages: [] });
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    setSelectedUser: (user) => {
        set({ selectedUser: user, messages: [] });
    },

    subscribeToMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;

        // get the socket from authStore global state
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("newMessage");

        const targetId = selectedUser._id || selectedUser.id;

        socket.on("newMessage", (newMessage: any) => {
            if (newMessage.senderId !== targetId) return;
            set({
                // keep all the messages already and add the new one 
                messages: [...get().messages, newMessage]
            });
        });
    },

    unSubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        socket.off("newMessage");
    }
})); 