import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { ChatHeader } from "./ChatHeader";
import { MessageInput } from "./MessageInput";
import { MessageSkeleton } from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/timeUtlity";
import { useAuthStore } from "../store/user-auth.store";




export const ChatContainer = () => {
    const { messages, getMessages, isMessagesLoading, selectedUser, subscribeToMessages, unSubscribeFromMessages } = useChatStore();
    const { authUser } = useAuthStore();
    const messageEndRef = useRef<HTMLDivElement>(null);

    const targetUserId = selectedUser?._id || selectedUser?.id;

    useEffect(() => {
        if (!targetUserId) return;

        getMessages(String(targetUserId));
        subscribeToMessages();

        return () => {
            unSubscribeFromMessages();
        };
    }, [targetUserId]);

    useEffect(() => {
        if (messageEndRef.current && messages) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    if (!selectedUser) return null;

    if (isMessagesLoading) {
        return (
            <div className="flex-1 flex flex-col overflow-auto">
                <ChatHeader />
                <MessageSkeleton />
                <MessageInput />
            </div>
        );
    }

    const currentUserId = authUser?._id || authUser?.id;

    return (
        <div className="flex-1 flex flex-col overflow-auto">
            <ChatHeader />

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {Array.isArray(messages) && messages.map((message: any) => {
                    const isSender = currentUserId && message.senderId === currentUserId;
                    return (
                        <div
                            key={message._id || message.id || `${message.createdAt}-${Math.random()}`}
                            className={`chat ${isSender ? "chat-end" : "chat-start"}`}
                        >
                            <div className="chat-image avatar">
                                <div className="size-10 rounded-full border">
                                    <img
                                        src={
                                            isSender
                                                ? authUser?.imgUrl || authUser?.profileImg || "/avatar.png"
                                                : selectedUser?.imgUrl || selectedUser?.profileImg || "/avatar.png"
                                        }
                                        alt="profile pic"
                                    />
                                </div>
                            </div>
                            <div className="chat-header mb-1">
                                <time className="text-xs opacity-50 ml-1">
                                    {formatMessageTime(message.createdAt)}
                                </time>
                            </div>
                            <div className="chat-bubble flex flex-col">
                                {message.image && (
                                    <img
                                        src={message.image}
                                        alt="Attachment"
                                        className="sm:max-w-[200px] rounded-md mb-2"
                                    />
                                )}
                                {message.text && <p>{message.text}</p>}
                            </div>
                        </div>
                    );
                })}
                <div ref={messageEndRef} />
            </div>

            <MessageInput />
        </div>
    );
};
