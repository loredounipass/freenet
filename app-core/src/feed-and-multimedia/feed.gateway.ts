import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import connectRedis from 'connect-redis';
import Redis from 'ioredis';
import session from 'express-session';

@WebSocketGateway({ namespace: '/feed', cors: { origin: ['http://localhost:3000'], credentials: true } })
export class FeedGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('FeedGateway');
  private redisStore: any;

  constructor() {
    const RedisStore = connectRedis(session);
    const redisClient = new Redis({ host: process.env.REDIS_HOST!, port: parseInt(process.env.REDIS_PORT!) });
    this.redisStore = new RedisStore({ client: redisClient as any });
  }

  private parseCookies(cookieHeader: string | undefined) {
    const rc = cookieHeader || '';
    return rc.split(';').map(c => c.trim()).filter(Boolean).reduce((acc: any, item) => {
      const idx = item.indexOf('=');
      if (idx > -1) {
        const k = item.substring(0, idx);
        const v = item.substring(idx + 1);
        acc[k] = decodeURIComponent(v);
      }
      return acc;
    }, {});
  }

  async handleConnection(client: Socket) {
    try {
      const cookies = this.parseCookies(client.handshake.headers.cookie as string | undefined);
      const rawSid = cookies['connect.sid'] || cookies['sid'] || null;
      if (!rawSid) {
        this.logger.warn(`No session cookie present for socket ${client.id}`);
        client.emit('error', { message: 'Unauthorized' });
        client.disconnect();
        return;
      }

      let sid = rawSid;
      if (sid.startsWith('s:')) sid = sid.slice(2).split('.')[0];

      const sess = await this.getSession(sid);
      if (!sess) {
        client.emit('error', { message: 'Unauthorized' });
        client.disconnect();
        return;
      }

      const passportUser = sess.passport && sess.passport.user ? sess.passport.user : null;
      if (!passportUser) {
        client.emit('error', { message: 'Unauthorized' });
        client.disconnect();
        return;
      }

      client.data.user = passportUser;
      const userId = passportUser._id.toString();
      client.join(`user:${userId}`);
      this.logger.log(`Socket ${client.id} authenticated and joined user:${userId}`);
    } catch (e) {
      this.logger.error(`Error during socket auth for ${client.id}: ${e}`);
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect();
    }
  }

  private getSession(sid: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.redisStore.get(sid, (err: any, sess: any) => {
        if (err) return reject(err);
        resolve(sess);
      });
    });
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @OnEvent('post.created')
  async handlePostCreated(payload: any) {
    try {
      // emit to author's sockets and any post-specific room
      const authorId = payload.author;
      if (!authorId) return;
      const authorSockets = await this.server.in(`user:${authorId}`).allSockets();
      for (const s of authorSockets) this.server.to(s).emit('postCreated', payload);
    } catch (e) {
      this.logger.warn(`Error emitting post.created: ${e}`);
    }
  }

  @OnEvent('comment.created')
  async handleCommentCreated(payload: any) {
    try {
      const postId = payload.post;
      if (!postId) return;
      const postRoom = `post:${postId}`;
      const sockets = await this.server.in(postRoom).allSockets();
      for (const s of sockets) this.server.to(s).emit('commentCreated', payload);

      // also notify the post author via user room if included in payload
      if (payload.author) {
        const authorSockets = await this.server.in(`user:${payload.author}`).allSockets();
        for (const s of authorSockets) this.server.to(s).emit('commentCreated', payload);
      }
    } catch (e) {
      this.logger.warn(`Error emitting comment.created: ${e}`);
    }
  }

  @SubscribeMessage('joinPost')
  handleJoinPost(client: Socket, payload: { postId: string }) {
    if (!client.data?.user || !client.data.user._id) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }
    if (!payload || !payload.postId) {
      client.emit('error', { message: 'Missing postId' });
      return;
    }
    client.join(`post:${payload.postId}`);
    this.logger.log(`Socket ${client.id} joined post room post:${payload.postId}`);
  }
}
