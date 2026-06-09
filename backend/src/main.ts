import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

// Worker mode disabled for Phase A – all worker initialization omitted

  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Enable Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('JNI Solutions API')
    .setDescription('AI-powered driver support platform backend API endpoints')
    .setVersion('1.0')
    .addTag('Airports')
    .addTag('Earnings & Expenses')
    .addTag('Driver & Compliance')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 5000;
  await app.listen(port);
  
  logger.log(`JNI Solutions API is running on: http://localhost:${port}`);
  logger.log(`Swagger Documentation is available at: http://localhost:${port}/api/docs`);
}
bootstrap();

