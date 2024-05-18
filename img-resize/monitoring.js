const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch({ region: process.env.REGION });

function putMetricData(metricName, value) {
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

  cloudwatch.putMetricData(params, (err, data) => {
    if (err) {
      console.error('Error sending metric data to CloudWatch:', err);
    } else {
      console.log('Successfully sent metric data to CloudWatch:', data);
    }
  });
}

module.exports = putMetricData;
