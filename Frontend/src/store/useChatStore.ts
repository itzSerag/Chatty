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

        set({ isUsersLoading: true })
        try {
            // return an array of users from db
            const resUsers = await axiosInstance.get('users');
            set({ users: resUsers.data })
        } catch (error) {
            toast.error('Something went wrong, Please try again later')
            console.log(error);

        } finally {
            set({ isUsersLoading: false })
        }


    },

    sendMessage: async ({ text, imageBase64 }) => {
        try {
            const { selectedUser } = get();
            if (!selectedUser) return;
            await axiosInstance.post(`/message/send/${selectedUser._id}`, { text, imageBase64 });
            // Message will be added through the socket event
        } catch (err) {
            toast.error('Something went wrong, Please try again later')
            console.log(err);
        }
    },

    getMessages: async (userId: string) => {
        set({ isMessagesLoading: true })

        try {
            const resMessages = await axiosInstance.get(`message/messages/${userId}`)
            set({ messages: resMessages.data })
        } catch (error) {
            toast.error('Something went wrong, Please try again later')
            console.log(error);

        } finally {
            set({ isMessagesLoading: false })
        }
    },

    setSelectedUser: (user) => {
        set({ selectedUser: user })
    },


    subscribeToMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;

        // get the socket from authStore global state
        const socket = useAuthStore.getState().socket

        socket.on("newMessage", (newMessage) => {
            if (newMessage.senderId !== selectedUser._id) return
            set({
                // keep all the messages already and add the new one 
                messages: [...get().messages, newMessage]
            })
        })
    },

    unSubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket
        socket.off("newMessage")
    }


})) 