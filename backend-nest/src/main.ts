import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { RetentionService } from './privacy/retention.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Atras do proxy do Render, sem isto todo acesso chega com o mesmo IP (o do
  // proxy) e o limite de tentativas vira um balde unico para o hospital
  // inteiro: 5 senhas erradas de qualquer pessoa travavam o login de todos.
  // TRUST_PROXY = numero de proxies na frente (Render: 1). "0" desliga.
  const trustProxy = config.get<string>('TRUST_PROXY') ?? (process.env.NODE_ENV === 'production' ? '1' : '0');
  if (trustProxy !== '0') {
    app.set('trust proxy', Number.isNaN(Number(trustProxy)) ? trustProxy : Number(trustProxy));
  }
  const corsOrigins = config.get<string>('CORS_ORIGINS')?.split(',').map((origin) => origin.trim()) ?? [
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
    }),
  );
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(config.get<number>('PORT') ?? 8000);

  // Prazo de guarda (LGPD): limpeza automatica so no servidor de verdade —
  // os testes e2e montam o app sem passar por aqui.
  app.get(RetentionService).start();
}

void bootstrap();
