// MongoDB initialization script
// This script will run when the MongoDB container starts for the first time

db = db.getSiblingDB('urlshortener');

// Create collections with proper indexes
db.createCollection('users');
db.createCollection('links');
db.createCollection('analytics');

// Create indexes for better performance
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "createdAt": -1 });

db.links.createIndex({ "shortCode": 1 }, { unique: true });
db.links.createIndex({ "userId": 1, "createdAt": -1 });
db.links.createIndex({ "expiresAt": 1 }, { 
  expireAfterSeconds: 0, 
  partialFilterExpression: { "expiresAt": { $exists: true } }
});

db.analytics.createIndex({ "shortCode": 1, "timestamp": -1 });
db.analytics.createIndex({ "shortCode": 1, "country": 1 });
db.analytics.createIndex({ "shortCode": 1, "referrer": 1 });
db.analytics.createIndex({ "timestamp": -1 });

print("Database and collections initialized successfully!");
