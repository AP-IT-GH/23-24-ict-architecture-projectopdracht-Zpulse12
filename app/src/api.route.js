const { Router } = require('express');
const multer = require('multer');
const upload = multer({ dest: '../files/' }).single('file');
const { createUpload, getUploads, getUpload, deleteUpload, saveMetadata, getMetadata, getAllMetadata } = require('./postgres');
const { uploadToS3, downloadFromS3 } = require('./s3');
const { sendMessage } = require('./sqs');

const bucket = process.env.BUCKET;

const router = Router();

router.get('/', (req, res) => {
    res.json('Hello World!');
});

router.get('/health', (req, res) => {
    res.status(200).send('OK');
});

router.post('/uploads', upload, async (req, res) => {
    try {
        const { filename } = req.body;
        const { mimetype, size } = req.file;
        const { id } = await createUpload(mimetype, size, filename);

        const type = mimetype.startsWith('image/') ? 'image' : 'video';
        
        await uploadToS3(req.file.path, id.toString(), mimetype);
        await sendMessage({ id, type });

        // Simulate metadata extraction
        const metadata = [
            { key: 'Resolution', value: '1024x768' },
            { key: 'Format', value: mimetype }
        ];
        await saveMetadata(id, metadata);

        res.json({ id });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/uploads', async (req, res) => {
    try {
        const uploads = await getUploads();
        res.json(uploads);
    } catch (error) {
        console.error('Error fetching uploads:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/uploads/:id', async (req, res) => {
    try {
        const upload = await getUpload(req.params.id);
        res.json(upload);
    } catch (error) {
        console.error('Error fetching upload:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.delete('/uploads/:id', async (req, res) => {
    try {
        await deleteUpload(req.params.id);
        res.json({ message: 'ok' });
    } catch (error) {
        console.error('Error deleting upload:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/file/:id', async (req, res) => {
    try {
        const upload = await getUpload(req.params.id);
        if (!upload) {
            return res.status(404).json({ message: 'File not found' });
        }

        const body = await downloadFromS3(req.params.id, `/tmp/${upload.filename}`);
        res.setHeader('Content-Type', upload.mimetype);
        res.setHeader('Content-Disposition', `inline; filename="${upload.filename}"`);
        res.sendFile(`/tmp/${upload.filename}`);
    } catch (error) {
        console.error('Error fetching file:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/uploads/:id/metadata', async (req, res) => {
    try {
        const metadata = await getMetadata(req.params.id);
        res.json(metadata);
    } catch (error) {
        console.error('Error fetching metadata:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/meta', async (req, res) => {
    try {
        const metadata = await getAllMetadata();
        res.json(metadata);
    } catch (error) {
        console.error('Error fetching all metadata:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
