import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
    cors: {
        origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
            if (!origin) return callback(null, true);
            const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
            if (isLocal || origin === 'https://realtime-mern-chatty-frontend.vercel.app') {
                return callback(null, true);
            }
            return callback(new Error('Blocked by CORS'), false);
        },
        credentials: true,
    },
})
export class WebSocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer() server: Server;
    private onlineUsers: Record<string, string> = {};

    handleConnection(client: Socket) {
        const userId = client.handshake.query.userId as string;
        if (!userId) {
            console.error("No userId provided in WebSocket handshake!");
            return;
        }
        this.onlineUsers[userId] = client.id;
        this.server.emit("getOnlineUsers", Object.keys(this.onlineUsers));
    }

    handleDisconnect(client: Socket) {
        const userId = Object.keys(this.onlineUsers).find((id) => this.onlineUsers[id] === client.id);

        if (userId) {
            delete this.onlineUsers[userId]; // Remove from online list
            console.log(`User ${userId} disconnected. Current online users:`, this.onlineUsers);
            this.server.emit("getOnlineUsers", Object.keys(this.onlineUsers)); // get all the connected users in the app
        }
    }


    getReceiverSocketId(userId: string) {
        return this.onlineUsers[userId];
    }
}
