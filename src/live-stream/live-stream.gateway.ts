import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class LiveStreamGateway {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('LiveStreamGateway');

  @SubscribeMessage('startStream')
  handleStreamStart(@MessageBody() data: Buffer, @ConnectedSocket() client: Socket) {
    const role = client.handshake.auth.role;
    if (role !== 'admin') {
      this.logger.warn(`Unauthorized access attempt to start stream by ${client.id}`);
      return;
    }

    this.logger.log(`Starting stream by ${client.id}`);
    this.server.emit('streamStarted', data); // Ensure this emits data correctly
  }

  @SubscribeMessage('stopStream')
  handleStreamStop(@ConnectedSocket() client: Socket) {
    const role = client.handshake.auth.role;
    if (role !== 'admin') {
      this.logger.warn(`Unauthorized access attempt to stop stream by ${client.id}`);
      return;
    }

    this.logger.log(`Stopping stream by ${client.id}`);
    this.server.emit('streamStopped');
  }

  @SubscribeMessage('viewStream')
  handleStreamView(@ConnectedSocket() client: Socket) {
    const role = client.handshake.auth.role;
    if (role !== 'viewer' && role !== 'admin') {
      this.logger.warn(`Unauthorized access attempt to view stream by ${client.id}`);
      return;
    }

    this.logger.log(`Viewing stream by ${client.id}`);
    this.server.emit('streamData');
  }
}
