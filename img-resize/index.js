const logger = require('./logger');
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const { resizeImage } = require('./resize');
const { processVideo } = require('./video');
const putMetricData = require('./monitoring');

const region = process.env.REGION;
const sqsClient = new SQSClient({ region });
const queueUrl = process.env.QUEUE_URL;

async function pollMessages() {
  const params = {
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 20
  };

  try {
    const data = await sqsClient.send(new ReceiveMessageCommand(params));
    logger.debug(`Received data from SQS: ${JSON.stringify(data)}`);
    
    if (data.Messages && data.Messages.length > 0) {
      for (const message of data.Messages) {
        const sizes = 'large,medium,640x360';
        const obj = JSON.parse(message.Body);

        if (obj.type === 'image') {
          logger.info(`Processing image message: ${message.MessageId}`);
          await resizeImage(obj.id.toString(), sizes);
          logger.debug(`Resized image for message: ${message.MessageId}`);
        } else if (obj.type === 'video') {
          logger.info(`Processing video message: ${message.MessageId}`);
          await processVideo(obj.id.toString(), obj.watermarkId.toString());
          logger.debug(`Processed video for message: ${message.MessageId}`);
        }

        const deleteParams = {
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle
        };
        await sqsClient.send(new DeleteMessageCommand(deleteParams));
        logger.info(`Deleted message from queue: ${message.MessageId}`);
        putMetricData('ProcessedMessages', 1); // Log metric to CloudWatch
      }
    } else {
      logger.info("Geen nieuwe berichten beschikbaar.");
    }
  } catch (err) {
    logger.error(`Er is een fout opgetreden: ${err}`);
    putMetricData('ErrorCount', 1); // Log error metric to CloudWatch
  }
}

setInterval(pollMessages, 30000);
