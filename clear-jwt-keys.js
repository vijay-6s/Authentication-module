const { MongoClient } = require('mongodb');
require('dotenv').config();

async function clearJWTKeys() {
  const client = new MongoClient(process.env.MONGODB_URL, {
    tlsAllowInvalidCertificates: true,
  });
  
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME || 'test');
    
    // Delete JWT keys collection
    const result = await db.collection('key').deleteMany({});
    console.log(`Deleted ${result.deletedCount} JWT keys from database`);
    console.log('Restart your server to generate new HS256 keys');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

clearJWTKeys();
