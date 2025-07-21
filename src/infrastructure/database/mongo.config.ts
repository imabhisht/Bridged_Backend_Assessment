// MongoDB Configuration for Different Environments
export interface MongoConfig {
  maxPoolSize: number;
  minPoolSize: number;
  maxIdleTimeMS: number;
  serverSelectionTimeoutMS: number;
  socketTimeoutMS: number;
  connectTimeoutMS: number;
  heartbeatFrequencyMS: number;
  retryWrites: boolean;
  retryReads: boolean;
  compressors: ('none' | 'snappy' | 'zlib' | 'zstd')[];
  readPreference: string;
  writeConcern: {
    w: number;
    j: boolean;
    wtimeout: number;
  };
}

export const mongoConfigs = {
  development: {
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
    retryReads: true,
    compressors: ['zlib'] as ('none' | 'snappy' | 'zlib' | 'zstd')[],
    readPreference: 'primary',
    writeConcern: {
      w: 1,
      j: true, // Enable journaling in development for data safety
      wtimeout: 5000,
    },
  } as MongoConfig,

  production: {
    maxPoolSize: 50, // Higher for production load
    minPoolSize: 10, // Higher minimum for consistent performance
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
    retryReads: true,
    compressors: ['zlib', 'snappy'] as ('none' | 'snappy' | 'zlib' | 'zstd')[], // Multiple compression options
    readPreference: 'primaryPreferred', // Allow reading from secondaries
    writeConcern: {
      w: 1, // Fast writes for high volume
      j: false, // Disable journaling for better performance (trade-off)
      wtimeout: 5000,
    },
  } as MongoConfig,

  staging: {
    maxPoolSize: 25,
    minPoolSize: 5,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
    retryReads: true,
    compressors: ['zlib'] as ('none' | 'snappy' | 'zlib' | 'zstd')[],
    readPreference: 'primaryPreferred',
    writeConcern: {
      w: 1,
      j: false,
      wtimeout: 5000,
    },
  } as MongoConfig,

  // High-volume specific configuration
  highVolume: {
    maxPoolSize: 100, // Very high connection pool
    minPoolSize: 20,
    maxIdleTimeMS: 60000, // Longer idle time to avoid connection churn
    serverSelectionTimeoutMS: 3000, // Faster failover
    socketTimeoutMS: 30000, // Shorter socket timeout
    connectTimeoutMS: 5000, // Faster connection timeout
    heartbeatFrequencyMS: 5000, // More frequent health checks
    retryWrites: true,
    retryReads: true,
    compressors: ['snappy'] as ('none' | 'snappy' | 'zlib' | 'zstd')[], // Fastest compression
    readPreference: 'secondaryPreferred', // Distribute read load
    writeConcern: {
      w: 1,
      j: false, // No journaling for maximum speed
      wtimeout: 2000, // Faster timeout
    },
  } as MongoConfig,
};

export function getMongoConfig(environment: string = 'development'): MongoConfig {
  const env = process.env.NODE_ENV || environment;
  const isHighVolume = process.env.HIGH_VOLUME_MODE === 'true';
  
  if (isHighVolume) {
    return mongoConfigs.highVolume;
  }
  
  return mongoConfigs[env as keyof typeof mongoConfigs] || mongoConfigs.development;
}
