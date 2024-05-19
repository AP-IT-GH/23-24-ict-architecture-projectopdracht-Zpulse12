const express = require('express');
const cors = require('cors');
const apiRoute = require('./api.route');

const app = express();
app.use(cors()); // Add this line to enable CORS

app.use('/api', apiRoute);

app.use(express.static('public'));

app.listen(3000, () => {
    console.log('Upload app listening on port 3000!');
});
