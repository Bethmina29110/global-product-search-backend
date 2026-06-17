import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
const DailyRotateFile = require('winston-daily-rotate-file');

/**
 * Parses max size string (e.g., '20m', '100k', '1g') to bytes.
 * 
 * Supports size units: k (kilobytes), m (megabytes), g (gigabytes).
 * If no unit is specified, returns the value as bytes.
 * 
 * @param sizeStr - Size string (e.g., '20m', '100k', '1g')
 * @returns Size in bytes (default: 20MB if parsing fails)
 * 
 * @example
 * ```typescript
 * parseMaxSize('20m') // Returns 20971520 (20 * 1024 * 1024)
 * parseMaxSize('100k') // Returns 102400 (100 * 1024)
 * parseMaxSize('1g') // Returns 1073741824 (1 * 1024 * 1024 * 1024)
 * ```
 */
function parseMaxSize(sizeStr: string): number {
  const match = sizeStr.match(/^(\d+)([kmg]?)$/i);
  if (!match) return 20 * 1024 * 1024; // Default 20MB

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'g': return value * 1024 * 1024 * 1024;
    case 'm': return value * 1024 * 1024;
    case 'k': return value * 1024;
    default: return value;
  }
}

/**
 * Parses max files string (e.g., '14d', '30d', '7d') to number of days.
 * 
 * Expects format: '{number}d' where number is the days to retain logs.
 * 
 * @param filesStr - Files retention string (e.g., '14d', '30d')
 * @returns Number of days (default: 14 if parsing fails)
 * 
 * @example
 * ```typescript
 * parseMaxFiles('14d') // Returns 14
 * parseMaxFiles('30d') // Returns 30
 * parseMaxFiles('7d') // Returns 7
 * ```
 */
function parseMaxFiles(filesStr: string): number {
  const match = filesStr.match(/^(\d+)d$/i);
  if (!match) return 14; // Default 14 days
  return parseInt(match[1], 10);
}

/**
 * Winston format function that masks sensitive data in log output.
 * 
 * Automatically masks sensitive fields such as passwords, tokens, secrets,
 * API keys, credit cards, SSN, and PINs. Recursively processes nested objects
 * and arrays to ensure all sensitive data is masked.
 * 
 * **Masked Fields:**
 * - password, token, secret, refreshToken, accessToken
 * - authorization, apiKey, apikey
 * - creditCard, creditcard, ssn, pin
 * 
 * **Behavior:**
 * - Replaces sensitive values with '********'
 * - Preserves object structure
 * - Handles nested objects and arrays
 * - Processes Error objects and metadata
 * 
 * @example
 * ```typescript
 * // Input: { user: { email: 'user@example.com', password: 'secret123' } }
 * // Output: { user: { email: 'user@example.com', password: '********' } }
 * ```
 */
const maskSensitiveData = winston.format((info) => {
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'refreshToken',
    'accessToken',
    'authorization',
    'apiKey',
    'apikey',
    'creditCard',
    'creditcard',
    'ssn',
    'pin',
  ];

  const maskValue = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(maskValue);

    const masked: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
        masked[key] = '********';
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = maskValue(value);
      } else {
        masked[key] = value;
      }
    }
    return masked;
  };

  if (info.message && typeof info.message === 'object') {
    if (info.message instanceof Error) {
      info.message = info.message.message || 'Error occurred';
    } else if (Object.keys(info.message).some(k => /^\d+$/.test(k))) {
      const msgObj = info.message as any;
      const msg = msgObj.message || msgObj.code || 'Error occurred';
      info.message = msg;
    } else {
      info.message = maskValue(info.message);
    }
  }
  
  if (info.metadata) {
    if (typeof info.metadata === 'object' && !Array.isArray(info.metadata)) {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(info.metadata)) {
        if (value instanceof Error) {
          cleaned[key] = value.message || 'Error';
        } else if (typeof value === 'object' && value !== null) {
          const keys = Object.keys(value);
          if (keys.length > 0 && keys.every(k => /^\d+$/.test(k))) {
            continue;
          }
          cleaned[key] = maskValue(value);
        } else {
          cleaned[key] = maskValue(value);
        }
      }
      info.metadata = cleaned;
    } else {
      info.metadata = maskValue(info.metadata);
    }
  }
  
  const infoKeys = Object.keys(info);
  if (infoKeys.some(k => /^\d+$/.test(k))) {
    for (const key of infoKeys) {
      if (/^\d+$/.test(key)) {
        delete info[key];
      }
    }
  }
  
  if (info.context) {
    info.context = maskValue(info.context);
  }

  return info;
});

/**
 * Winston logger configuration interface.
 * 
 * Defines the structure of Winston logger configuration.
 */
export interface WinstonLoggerConfig {
  /** Log level (error, warn, info, http, verbose, debug, silly) */
  level: string;
  /** Log format (JSON format) */
  format: winston.Logform.Format;
  /** Log transports (console, file) */
  transports: winston.transport[];
  /** Exception handlers (optional) */
  exceptionHandlers?: winston.transport[];
  /** Rejection handlers (optional) */
  rejectionHandlers?: winston.transport[];
  /** Whether to exit on error (default: false) */
  exitOnError: boolean;
}

/**
 * Creates Winston logger configuration based on environment variables.
 * 
 * **Features:**
 * - JSON format for both console and file transports
 * - Daily log rotation with compression
 * - Separate error log file
 * - Sensitive data masking (passwords, tokens, etc.)
 * - Configurable log levels and file sizes
 * - Exception and rejection handlers
 * 
 * **Environment Variables:**
 * - `LOG_LEVEL`: Log level (default: 'info')
 * - `LOG_FILE_ENABLED`: Enable file logging (default: true)
 * - `LOG_FILE_PATH`: App log file path (default: 'logs/app.log')
 * - `LOG_ERROR_FILE_PATH`: Error log file path (default: 'logs/error.log')
 * - `LOG_MAX_SIZE`: Max log file size (default: '20m')
 * - `LOG_MAX_FILES`: Max log files retention (default: '14d')
 * - `LOG_COMPRESS`: Compress rotated logs (default: true)
 * 
 * **Log Format:**
 * - All logs are in JSON format for easy parsing
 * - Sensitive data (passwords, tokens) is automatically masked
 * - Timestamps are included in ISO format
 * - Stack traces are included for errors
 * 
 * **Usage:**
 * ```typescript
 * WinstonModule.forRootAsync({
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (configService: ConfigService) => getWinstonLoggerConfig(configService),
 * })
 * ```
 * 
 * @param configService - NestJS ConfigService instance
 * @returns Winston logger configuration object
 */
export const createWinstonLogger = (configService: ConfigService): WinstonLoggerConfig => {
  const logLevel = configService.get<string>('LOG_LEVEL', 'info');
  const logFileEnabled = configService.get<boolean>('LOG_FILE_ENABLED', true);
  const logFilePath = configService.get<string>('LOG_FILE_PATH', 'logs/app.log');
  const logErrorFilePath = configService.get<string>('LOG_ERROR_FILE_PATH', 'logs/error.log');
  const logMaxSize = configService.get<string>('LOG_MAX_SIZE', '20m');
  const logMaxFiles = configService.get<string>('LOG_MAX_FILES', '14d');
  const logCompress = configService.get<boolean>('LOG_COMPRESS', true);

  if (logFileEnabled) {
    try {
      const logDir = path.dirname(logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      const errorLogDir = path.dirname(logErrorFilePath);
      if (!fs.existsSync(errorLogDir)) {
        fs.mkdirSync(errorLogDir, { recursive: true });
      }
    } catch (error) {
      console.error('[Logger Config] Failed to create log directories:', error);
    }
  }

  // Always use JSON format for both console and files
  const getConsoleFormat = () => {
    return winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      maskSensitiveData(),
      winston.format.json(),
    );
  };

  const getFileFormat = () => {
    return winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      maskSensitiveData(),
      winston.format.json(),
    );
  };

  const transports: winston.transport[] = [
    new winston.transports.Console({
      level: logLevel,
      format: getConsoleFormat(),
    }),
  ];

  if (logFileEnabled) {
    const appLogFilename = path.basename(logFilePath, path.extname(logFilePath)) + '-%DATE%' + path.extname(logFilePath);
    const errorLogFilename = path.basename(logErrorFilePath, path.extname(logErrorFilePath)) + '-%DATE%' + path.extname(logErrorFilePath);
    
    const appLogTransport = new DailyRotateFile({
      dirname: path.dirname(logFilePath),
      filename: appLogFilename,
      datePattern: 'YYYY-MM-DD',
      level: logLevel,
      maxSize: parseMaxSize(logMaxSize),
      maxFiles: `${parseMaxFiles(logMaxFiles)}d`,
      zippedArchive: logCompress,
      format: getFileFormat(),
    });

    appLogTransport.on('error', (err: Error) => {
      console.error('[Logger] Error writing to app log file:', err);
    });

    transports.push(appLogTransport);

    const errorLogTransport = new DailyRotateFile({
      dirname: path.dirname(logErrorFilePath),
      filename: errorLogFilename,
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: parseMaxSize(logMaxSize),
      maxFiles: `${parseMaxFiles(logMaxFiles)}d`,
      zippedArchive: logCompress,
      format: getFileFormat(),
    });

    errorLogTransport.on('error', (err: Error) => {
      console.error('[Logger] Error writing to error log file:', err);
    });

    transports.push(errorLogTransport);
  }

  return {
    level: logLevel,
    format: getConsoleFormat(),
    transports,
    exceptionHandlers: logFileEnabled
      ? [
          new DailyRotateFile({
            dirname: path.dirname(logErrorFilePath),
            filename: `exceptions-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            maxSize: parseMaxSize(logMaxSize),
            maxFiles: `${parseMaxFiles(logMaxFiles)}d`,
            zippedArchive: logCompress,
            format: getFileFormat(),
          }),
        ]
      : [],
    rejectionHandlers: logFileEnabled
      ? [
          new DailyRotateFile({
            dirname: path.dirname(logErrorFilePath),
            filename: `rejections-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            maxSize: parseMaxSize(logMaxSize),
            maxFiles: `${parseMaxFiles(logMaxFiles)}d`,
            zippedArchive: logCompress,
            format: getFileFormat(),
          }),
        ]
      : [],
    exitOnError: false,
  };
};

/**
 * Gets Winston logger configuration.
 * 
 * Convenience wrapper around createWinstonLogger for use in NestJS modules.
 * 
 * @param configService - NestJS ConfigService instance
 * @returns Winston logger configuration object
 */
export const getWinstonLoggerConfig = (configService: ConfigService): WinstonLoggerConfig => {
  return createWinstonLogger(configService);
};

/**
 * Creates a Winston logger instance.
 * 
 * Creates and returns a configured Winston logger instance ready for use.
 * 
 * @param configService - NestJS ConfigService instance
 * @returns Configured Winston logger instance
 */
export const createWinstonLoggerInstance = (configService: ConfigService) => {
  const config = createWinstonLogger(configService);
  return WinstonModule.createLogger(config);
};
