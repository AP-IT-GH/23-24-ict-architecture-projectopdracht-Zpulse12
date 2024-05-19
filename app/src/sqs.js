const { SendMessageCommand, SQSClient } = require("@aws-sdk/client-sqs");

const queueUrl = process.env.QUEUE_URL;
const region = process.env.REGION;

if (!queueUrl || !region) {
  console.error("Queue URL or Region not defined in environment variables.");
  process.exit(1);
}

const client = new SQSClient({
  region,
  credentials: process.env.ACCESS_KEY_ID ? {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    sessionToken: process.env.SESSION_TOKEN
  } : undefined,
});

async function sendMessage(obj) {
  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(obj)
  });

  try {
    const response = await client.send(command);
    console.log('Successfully sent message to SQS:', response);
    return response;
  } catch (error) {
    console.error('Error sending message to SQS:', error);
    throw error;  // Re-throw the error after logging
  }
}

module.exports = { sendMessage };
