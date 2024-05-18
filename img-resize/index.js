// Importeer de benodigde AWS SDK clients en commands
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
 
// AWS SQS client configuratie
const sqsClient = new SQSClient({ });
 
const {resizeImage} = require('./resize');
 
// De URL van jouw SQS queue
const queueUrl = process.env.QUEUE_URL;
 
 
// Functie om berichten van SQS te ontvangen en te verwerken
async function pollMessages() {
    const params = {
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,  // Aantal berichten om in één keer te ontvangen
        WaitTimeSeconds: 20       // Long polling interval
    };
 
    try {
        const data = await sqsClient.send(new ReceiveMessageCommand(params));
        if (data.Messages && data.Messages.length > 0) {
            for (const message of data.Messages) {
                const sizes = 'large,medium,640x360';
                const obj = JSON.parse(message.Body)
                await resizeImage(obj.id.toString(), sizes);
 
                // Verwijder het bericht na verwerking
                const deleteParams = {
                    QueueUrl: queueUrl,
                    ReceiptHandle: message.ReceiptHandle
                };
                await sqsClient.send(new DeleteMessageCommand(deleteParams));
            }
        } else {
            console.log("Geen nieuwe berichten beschikbaar.");
        }
    } catch (err) {
        console.error("Er is een fout opgetreden:", err);
    }
}
 
// Start de polling loop
setInterval(pollMessages, 30000);  // Poll elke 30 seconden
//console.log('starting polling')
//pollMessages()