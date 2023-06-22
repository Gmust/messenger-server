import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import * as session from 'express-session';
import * as passport from 'passport';
import * as process from 'process';

config();

async function bootstrap() {
  try {
    const PORT = process.env.DB_PORT || 5000;
    const app = await NestFactory.create(AppModule);
    app.enableCors({
      credentials: true,
      origin: process.env.ORIGIN
    });
    app.use(
      session({
        secret: process.env.SESSION_SECRET,
        saveUninitialized: false,
        resave: false,
        cookie: {
          maxAge: 24 * 60 * 60 * 1000
        },
      }),
    );
    app.use(passport.initialize());
    app.use(passport.session());
    await app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  } catch (e) {
    console.log(e);
  }
}

bootstrap();
