'use strict';

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
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

async function resizeImage(objectKey, sizes, quality = 70) {
  try {
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    });

    logger.info(`Getting object from S3: ${bucket}/${objectKey}`);
    const { Body } = await s3.send(getObjectCommand);
    const originalImage = await streamToBuffer(Body);

    const input = sharp(originalImage);
    const metadata = await input.metadata();

    for (let size of sizes.split(',')) {
      const { width, height } = getNewDimensions(metadata, size);

      const resizedImage = await input
        .resize(Math.round(width), Math.round(height))
        .toFormat('jpeg', { quality })
        .toBuffer();

      const key = `${objectKey.split('.')[0]}-resized-${size}.jpg`;
      const putObjectCommand = new PutObjectCommand({
        Body: resizedImage,
        Bucket: bucket,
        ContentType: 'image/jpeg',
        Key: key,
      });

      logger.info(`Putting object to S3: ${bucket}/${key}`);
      await s3.send(putObjectCommand);
    }
  } catch (error) {
    logger.error('Error resizing image:', error);
    throw error;  // Re-throw the error after logging
  }
}

function getNewDimensions(metadata, size) {
  let { newWidth, newHeight } = getDimensions(size);
  const { width, height } = metadata;
  if (!width || !height) throw new Error('Invalid image');

  const ratio = width / height;

  if (newWidth > width) {
    newWidth = width;
    newHeight = height;
  } else if (newHeight > height) {
    newWidth = width;
    newHeight = height;
  } else {
    if (ratio > 1) {
      newHeight = newWidth / ratio;
    } else {
      newWidth = newHeight * ratio;
    }
  }

  return { width: newWidth, height: newHeight };
}

function getDimensions(size) {
  logger.info(`getDimensions for size: ${size}`);
  switch (size) {
    case 'large':
      return { newWidth: 1920, newHeight: 1080 };
    case 'medium':
      return { newWidth: 1280, newHeight: 720 };
    case 'small':
      return { newWidth: 640, newHeight: 360 };
    default:
      const [newWidth, newHeight] = size.split('x').map(Number);
      return { newWidth, newHeight };
  }
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

module.exports = {
  resizeImage
};
