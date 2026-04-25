// ============================================
// VisionCure — Express Server Entry Point
// ============================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// ---- Middleware ----
app.use(cors({
  origin: ['http://localhost:5173', 'https://localhost:5173', /^http:\/\/10\.\d+\.\d+\.\d+:5173$/, /^https:\/\/10\.\d+\.\d+\.\d+:5173$/],
  credentials: true
}));
app.use(express.json({ limit: '20mb' })); // base64 images can be large
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Request logging for debugging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Rate limit: max 60 requests per minute per IP (covers ~1 req/sec from frontend)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', arState: 'ERROR', message: 'Rate limit exceeded. Slow down.' }
});
app.use('/api/', limiter);

// ---- Database Connection ----
const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/visioncure';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('[DATABASE] Connected to Local MongoDB successfully!'))
  .catch(err => console.error('[DATABASE] MongoDB connection error:', err));

// Serve Uploads folder statically (for Profile Pictures)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---- Routes ----
const authRoutes = require('./routes/authRoutes');
const prescriptionRoutes = require('./routes/prescription');
const userRoutes = require('./routes/user');
const { startScheduler } = require('./services/reminderScheduler');

app.use('/api/auth', authRoutes);
app.use('/api/prescription', prescriptionRoutes);
app.use('/api/user', userRoutes);
app.use('/api', apiRoutes);

// Start Background Services
startScheduler();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'visioncure-middleware', timestamp: new Date().toISOString() });
});

// ---- Global Error Handler ----
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.message);
  res.status(500).json({
    status: 'error',
    arState: 'ERROR',
    detectedDrug: null,
    schedule: null,
    contraindications: [],
    message: 'Internal server error.',
    errorCode: 'INTERNAL_ERROR'
  });
});

// ---- Start ----
const os = require('os');
const networkInterfaces = os.networkInterfaces();
let networkIp = '192.168.x.x';

for (const interfaceName in networkInterfaces) {
  for (const iface of networkInterfaces[interfaceName]) {
    if (iface.family === 'IPv4' && !iface.internal) {
      networkIp = iface.address;
    }
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🧿 VisionCure middleware running on http://localhost:${PORT} \x1b[36m(Local)\x1b[0m`);
  console.log(`   Network: http://${networkIp}:${PORT} \x1b[36m(Network)\x1b[0m`);
  console.log(`   Mock mode: ${process.env.USE_MOCK === 'true' ? 'ON' : 'OFF'}\n`);
});
