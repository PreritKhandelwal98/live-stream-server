import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class LiveStreamGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('startStream')
  handleStartStream(@MessageBody() data: any): void {
    this.server.emit('streamData', data);
  }

  @SubscribeMessage('stopStream')
  handleStopStream(@MessageBody() data: any): void {
    this.server.emit('streamStopped', data);
  }
}
