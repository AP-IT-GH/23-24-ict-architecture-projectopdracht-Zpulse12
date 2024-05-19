const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { readFileSync } = require('fs');

const bucket = process.env.BUCKET;
const region = process.env.REGION;

if (!bucket || !region) {
  console.error("Bucket or Region not defined in environment variables.");
  process.exit(1);
}

const s3 = new S3Client({
  region,
  credentials: process.env.ACCESS_KEY_ID ? {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    sessionToken: process.env.SESSION_TOKEN
  } : undefined,
});

async function uploadToS3(filePath, key) {
  const putObjectCommand = new PutObjectCommand({
    Body: readFileSync(filePath),
    Bucket: bucket,
    ContentType: 'image/jpeg',
    Key: key,
  });

  console.log('putting object to s3', bucket, key, filePath);

  try {
    await s3.send(putObjectCommand);
    console.log('Successfully uploaded object to S3:', key);
  } catch (error) {
    console.error('Error uploading object to S3:', error);
    throw error;  // Re-throw the error after logging
  }
}

async function downloadFromS3(key) {
  const getObjectCommand = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  console.log('getting object from s3', bucket, key);
  
  try {
    const { Body } = await s3.send(getObjectCommand);
    console.log('Successfully downloaded object from S3:', key);
    return Body;
  } catch (error) {
    console.error('Error downloading object from S3:', error);
    throw error;  // Re-throw the error after logging
  }
}

module.exports = {
  uploadToS3,
  downloadFromS3,
};
