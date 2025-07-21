import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getMongoConfig } from './mongo.config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const mongoUri = configService.get<string>('MONGO_URI') || 'mongodb://localhost:27017/url-shortener';
        const environment = configService.get<string>('NODE_ENV') || 'development';
        const config = getMongoConfig(environment);
        
        return {
          uri: mongoUri,
          
          // Essential Connection Pool Settings
          maxPoolSize: config.maxPoolSize,
          minPoolSize: config.minPoolSize,
          
          // Basic Connection Settings
          serverSelectionTimeoutMS: config.serverSelectionTimeoutMS,
          socketTimeoutMS: config.socketTimeoutMS,
          connectTimeoutMS: config.connectTimeoutMS,
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule],
})
export class MongooseDatabaseModule {}
