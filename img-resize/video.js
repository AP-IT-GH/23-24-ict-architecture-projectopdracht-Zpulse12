'use strict';

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

const bucket = process.env.BUCKET;
const region = process.env.REGION;

if (!bucket || !region) {
  logger.error("Bucket or Region not defined in environment variables.");
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

async function processVideo(key) {
  const inputPath = path.join('/tmp', key);

  try {
    await downloadFromS3(key, inputPath);

    const outputKey = `${key.split('.')[0]}_uploaded.mp4`;
    await uploadToS3(inputPath, outputKey, 'video/mp4');
  } catch (error) {
    logger.error(`Error processing video: ${error}`);
    throw error;
  }
}

async function downloadFromS3(key, downloadPath) {
  const getObjectCommand = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  logger.info(`Downloading object from S3: ${bucket}/${key}`);
  const { Body } = await s3.send(getObjectCommand);
  const stream = Body.pipe(fs.createWriteStream(downloadPath));
  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function uploadToS3(filePath, key, contentType) {
  const fileStream = fs.createReadStream(filePath);
  const putObjectCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileStream,
    ContentType: contentType,
  });

  logger.info(`Uploading object to S3: ${bucket}/${key}`);
  await s3.send(putObjectCommand);
}

module.exports = {
  processVideo
};
