import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'process';

async function bootstrap() {
  try {
    const PORT = process.env.DB_PORT || 5000;
    const app = await NestFactory.create(AppModule);
    app.enableCors({
        credentials: true,
        origin: process.env.ORIGIN
    })
    await app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  } catch (e) {
    console.log(e);
  }
}

bootstrap();
