const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require('fs');
const path = require('path');

const bucket = process.env.BUCKET;
const region = process.env.REGION;

const s3 = new S3Client({
  region,
  credentials: process.env.ACCESS_KEY_ID ? {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    sessionToken: process.env.SESSION_TOKEN
  } : undefined,
});

async function uploadToS3(filePath, key, contentType) {
  const fileContent = fs.readFileSync(filePath);
  const putObjectCommand = new PutObjectCommand({
    Body: fileContent,
    Bucket: bucket,
    ContentType: contentType,
    Key: key,
  });

  console.log('putting object to s3', bucket, key, filePath);

  try {
    await s3.send(putObjectCommand);
    console.log('Successfully uploaded object to S3:', key);
  } catch (error) {
    console.error('Error uploading object to S3:', error);
    throw error;
  }
}

async function downloadFromS3(key, downloadPath) {
  const getObjectCommand = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  console.log('getting object from s3', bucket, key);

  try {
    const { Body } = await s3.send(getObjectCommand);
    const writeStream = fs.createWriteStream(downloadPath);
    Body.pipe(writeStream);
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    console.log('Successfully downloaded object from S3:', key);
  } catch (error) {
    console.error('Error downloading object from S3:', error);
    throw error;
  }
}

module.exports = {
  uploadToS3,
  downloadFromS3,
};
