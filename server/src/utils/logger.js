import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
  }

  writeToFile(level, message, meta = {}) {
    if (this.isDevelopment) return; // Only log to file in production

    const logFile = path.join(logsDir, `${level}.log`);
    const formattedMessage = this.formatMessage(level, message, meta);
    
    fs.appendFile(logFile, formattedMessage + '\n', (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });
  }

  info(message, meta = {}) {
    const formattedMessage = this.formatMessage('info', message, meta);
    console.log(`📋 ${formattedMessage}`);
    this.writeToFile('info', message, meta);
  }

  error(message, meta = {}) {
    const formattedMessage = this.formatMessage('error', message, meta);
    console.error(`❌ ${formattedMessage}`);
    this.writeToFile('error', message, meta);
  }

  warn(message, meta = {}) {
    const formattedMessage = this.formatMessage('warn', message, meta);
    console.warn(`⚠️  ${formattedMessage}`);
    this.writeToFile('warn', message, meta);
  }

  debug(message, meta = {}) {
    if (!this.isDevelopment) return;
    
    const formattedMessage = this.formatMessage('debug', message, meta);
    console.log(`🔍 ${formattedMessage}`);
  }

  success(message, meta = {}) {
    const formattedMessage = this.formatMessage('success', message, meta);
    console.log(`✅ ${formattedMessage}`);
    this.writeToFile('info', message, { ...meta, level: 'success' });
  }

  // Log API requests
  request(req, res, responseTime) {
    const meta = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    };

    if (res.statusCode >= 400) {
      this.error(`HTTP ${res.statusCode} ${req.method} ${req.originalUrl}`, meta);
    } else {
      this.info(`HTTP ${res.statusCode} ${req.method} ${req.originalUrl}`, meta);
    }
  }

  // Log video processing events
  videoProcessing(event, videoId, meta = {}) {
    const message = `Video Processing: ${event} - ${videoId}`;
    this.info(message, { videoId, event, ...meta });
  }

  // Log AI service events
  aiService(event, meta = {}) {
    const message = `AI Service: ${event}`;
    this.info(message, { event, ...meta });
  }

  // Log database events
  database(event, meta = {}) {
    const message = `Database: ${event}`;
    
    if (event.includes('error') || event.includes('failed')) {
      this.error(message, meta);
    } else {
      this.info(message, meta);
    }
  }
}

export default new Logger();