const express = require('express');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();
const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const upload = multer({ dest: 'uploads/' });

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

// Endpoint untuk generate text dari prompt
app.post('/generate-text', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    try {
        const result = await model.generateContent(prompt);
        res.json({ output: result.response.text() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Fungsi helper untuk encode gambar
function imageGenerativePart(imagePath) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(imagePath)).toString('base64'),
            mimeType: 'image/jpeg',
        },
    };
}

// Endpoint untuk generate text dari gambar
app.post('/generate-from-image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Image file is required' });
    }

    const prompt = req.body.prompt || 'Describe the image';
    const image = imageGenerativePart(req.file.path);

    try {
        const result = await model.generateContent([prompt, image]);
        res.json({ output: result.response.text() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        // Hapus file upload setelah selesai
        fs.unlinkSync(req.file.path);
    }
});

// Endpoint untuk generate text dari dokumen
app.post('/generate-from-document', upload.single('document'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No document file uploaded' });
    }

    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    const base64Data = buffer.toString('base64');
    const mimeType = req.file.mimetype;

    try {
        const documentPart = {
            inlineData: { data: base64Data, mimeType }
        };

        const result = await model.generateContent(['Analyze this document', documentPart]);
        const response = await result.response; // penting di-await

        res.json({ output: response.text() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (req.file) {
            fs.unlinkSync(filePath);
        }
    }
});

