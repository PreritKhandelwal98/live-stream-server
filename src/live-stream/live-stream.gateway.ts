import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class LiveStreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('startStream')
  handleStartStream(client: Socket, data: Buffer) {
    console.log('Stream data received');
    this.server.emit('streamData', data);
  }

  @SubscribeMessage('stopStream')
  handleStopStream(client: Socket) {
    console.log('Stream stopped');
    this.server.emit('streamStopped');
  }
}
