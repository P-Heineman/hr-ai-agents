import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'http://localhost:8080';
const distPath = path.join(__dirname, 'dist');

// Middleware
app.use(express.json());
app.use(express.static(distPath));

console.log(`🔗 API backend URL: ${API_URL}`);

// API Proxy for candidates
app.get('/candidates', async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/candidates`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching candidates:', error.message);
    res.status(500).json({ error: 'שגיאה בשרת', details: error.message });
  }
});

// API Proxy for analyze
app.post('/analyze', async (req, res) => {
  try {
    console.log('📤 Sending to backend:', req.body);
    const response = await axios.post(
      `${API_URL}/analyze`,
      req.body,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000, // 2 minutes - AI takes time
      }
    );
    console.log('✅ Backend response received');
    res.setHeader('Content-Type', 'application/json');
    res.json(response.data);
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: 'שגיאה בשרת', details: error.message });
  }
});

// Fallback to index.html for all routes (SPA)
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Frontend server on port ${PORT}`);
  console.log(`🔗 Backend API: ${API_URL}`);
});
