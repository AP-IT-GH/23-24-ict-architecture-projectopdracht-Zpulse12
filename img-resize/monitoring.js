const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const logger = require('./logger');

const cloudwatchClient = new CloudWatchClient({ region: process.env.REGION });

async function putMetricData(metricName, value) {
  const params = {
    MetricData: [
      {
        MetricName: metricName,
        Dimensions: [
          {
            Name: 'ServiceName',
            Value: 'MyService'
          },
        ],
        Unit: 'Count',
        Value: value
      },
    ],
    Namespace: 'MyNamespace'
  };

  try {
    logger.info(`Sending metric data to CloudWatch: ${metricName}, Value: ${value}`);
    const data = await cloudwatchClient.send(new PutMetricDataCommand(params));
    logger.info('Successfully sent metric data to CloudWatch:', data);
  } catch (err) {
    logger.error('Error sending metric data to CloudWatch:', err);
  }
}

module.exports = putMetricData;
