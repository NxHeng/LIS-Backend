const { Storage } = require('@google-cloud/storage');
require('dotenv').config();
const path = require('path');

// Replace with the path to your service account key file
const keyFilename = path.join(__dirname, process.env.GOOGLE_KEY_FILENAME);

// Create a new Storage client using the service account key
const storage = new Storage({ keyFilename });

async function testGCSConnection() {
    try {
        // List buckets to verify connection
        const [buckets] = await storage.getBuckets();
        console.log('Buckets:');
        buckets.forEach(bucket => console.log(bucket.name));
    } catch (error) {
        console.error('Error connecting to Google Cloud Storage:', error);
    }
}

testGCSConnection();
