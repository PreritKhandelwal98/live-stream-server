import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class LiveStreamGateway {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('LiveStreamGateway');

  @SubscribeMessage('startStream')
  handleStream(@MessageBody() data: Buffer, @ConnectedSocket() client: Socket) {
    if (!client) {
      this.logger.error('Client is undefined');
      return;
    }

    this.logger.log(`Received stream data from ${client.id}`);
    // Handle stream data
    this.server.emit('streamData', data); // Ensure this emits data correctly
  }

  @SubscribeMessage('stopStream')
  handleStopStream(@ConnectedSocket() client: Socket) {
    if (!client) {
      this.logger.error('Client is undefined');
      return;
    }

    this.logger.log(`Stream stopped by ${client.id}`);
    this.server.emit('streamStopped');
  }
}
