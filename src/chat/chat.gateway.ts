import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer() server: Server;

  @SubscribeMessage('chatMessage')
  handleMessage(@MessageBody() message: { username: string; text: string }, client: Socket) {
    this.server.emit('chatMessage', message); // Broadcast the message to all connected clients
  }
}
