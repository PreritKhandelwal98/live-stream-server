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
    this.server.emit('streamStarted'); // Notify viewers that streaming has started
  }

  @SubscribeMessage('streamData')
  handleStreamData(@MessageBody() data: Buffer, @ConnectedSocket() client: Socket) {
    this.logger.log(`Received stream data from ${client.id} of size ${data.byteLength}`);
    this.server.emit('streamData', data); // Forward data to all connected viewers
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
    client.emit('streamStarted'); // Notify client that streaming has started
  }

  @SubscribeMessage('iceCandidate')
  handleIceCandidate(@MessageBody() candidate: any, @ConnectedSocket() client: Socket) {
    this.logger.log(`Received ICE candidate from ${client.id}`);
    this.server.emit('iceCandidate', candidate);
  }

  @SubscribeMessage('offer')
  handleOffer(@MessageBody() offer: any, @ConnectedSocket() client: Socket) {
    this.logger.log(`Received offer from ${client.id}`);
    this.server.emit('offer', offer);
  }

  @SubscribeMessage('answer')
  handleAnswer(@MessageBody() answer: any, @ConnectedSocket() client: Socket) {
    this.logger.log(`Received answer from ${client.id}`);
    this.server.emit('answer', answer);
  }
}
