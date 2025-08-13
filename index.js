const express = require('express');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('google-generativeai');

dotenv.config();
const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });

const upload = multer({ dest: 'uploads/' });

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});