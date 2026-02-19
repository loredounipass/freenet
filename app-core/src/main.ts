import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import * as express from 'express';
import { join } from 'path';

import connectRedis from 'connect-redis';
import Redis from 'ioredis'

import session from 'express-session';
import passport from 'passport';
import { ValidationPipe } from '@nestjs/common';


// This is the main entry point of the application. It sets up the NestJS application, configures CORS, global prefix, validation pipes, session management with Redis, and initializes Passport for authentication. Finally, it starts the application on the specified port.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['*'],
    credentials: true
  })


  // Set a global prefix for all routes in the application to 'secure/api' and configure global validation pipes to automatically validate incoming requests and reject any requests that contain properties that are not defined in the DTOs (Data Transfer Objects).
  app.setGlobalPrefix('secure/api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );
  

  // Configure session management using Redis as the session store. It creates a Redis client and uses it to store session data, with a secret key for signing the session ID cookie and a specified expiration time for the cookie.
  const RedisStore = connectRedis(session);
  const redisClient = new Redis({
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT!)
  });

  app.use(
    session({
      store: new RedisStore({ client: redisClient as any }),
      secret: process.env.TOKEN_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: parseInt(process.env.EXPIRE_IN!) }
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Serve uploaded files (multimedia staging & final) as static assets
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  await app.listen(parseInt(process.env.PORT!));
}
bootstrap();