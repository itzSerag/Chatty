import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";

import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";
import { useAuthStore } from "../store/user-auth.store";

export const Sidebar = () => {
    const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();

    const { onlineUsers, authUser } = useAuthStore();
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);

    useEffect(() => {
        getUsers();
    }, [getUsers]);

    const currentUserId = authUser?._id || authUser?.id;

    // the common users between all the users and the online users
    const filteredUsers = (Array.isArray(users) ? users : []).filter((u: any) => {
        const uId = u._id || u.id;
        if (currentUserId && uId === currentUserId) return false;
        if (showOnlineOnly) {
            return onlineUsers?.includes(uId);
        }
        return true;
    });

    if (isUsersLoading) return <SidebarSkeleton />;

    const selectedId = selectedUser?._id || selectedUser?.id;

    return (
        <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
            <div className="border-b border-base-300 w-full p-5">
                <div className="flex items-center gap-2">
                    <Users className="size-6" />
                    <span className="font-medium hidden lg:block">Contacts</span>
                </div>
                {/* TODO: Online filter toggle */}
                <div className="mt-3 hidden lg:flex items-center gap-2">
                    <label className="cursor-pointer flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={showOnlineOnly}
                            onChange={(e) => setShowOnlineOnly(e.target.checked)}
                            className="checkbox checkbox-sm"
                        />
                        <span className="text-sm">Show online only</span>
                    </label>
                    {/* -1 --> the curr user */}
                    <span className="text-xs text-zinc-500">({Math.max(0, (onlineUsers?.length || 1) - 1)} online)</span>
                </div>
            </div>

            {/* Showing the users */}
            <div className="overflow-y-auto w-full py-3">
                {filteredUsers.map((user: any) => {
                    const uId = user._id || user.id;
                    const isOnline = onlineUsers?.includes(uId);
                    return (
                        <button
                            key={uId}
                            onClick={() => setSelectedUser(user)}
                            className={`
                            w-full p-3 flex items-center gap-3
                            hover:bg-base-300 transition-colors
                            ${selectedId === uId ? "bg-base-200" : ""}
                `}
                        >
                            <div className="relative mx-auto lg:mx-0">
                                <img
                                    src={user.imgUrl || user.profileImg || "/avatar.png"}
                                    alt={user.username || "User"}
                                    className="size-12 object-cover rounded-full"
                                />
                                {isOnline && (
                                    <span
                                        className="absolute bottom-0 right-0 size-3 bg-green-400 
                                        rounded-full ring-2 ring-zinc-300"
                                    />
                                )}
                            </div>

                            {/* User info - only visible on larger screens */}
                            <div className="hidden lg:block text-left min-w-0">
                                <div className="font-medium truncate">{user.username}</div>
                                <div className="text-sm text-zinc-400">
                                    {isOnline ? "Online" : "Offline"}
                                </div>
                            </div>
                        </button>
                    );
                })}

                {filteredUsers.length === 0 && (
                    <div className="text-center text-zinc-500 py-4">No online users</div>
                )}
            </div>
        </aside>
    );
};
