import fs, { type PathLike } from "fs"
import { createLogger, format, transports, Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { env } from "../config/env.js";

const logPath : PathLike = path.resolve(process.cwd(), 'logs');
const isProduction : Boolean = env.NODE_ENV === 'production'; 
const SERVICE_NAME : String = env.SERVICE_NAME || 'Auth Service';


const maskFormat = format((info) => {
  const mask = (obj: any) => {
    const fieldsToMask = ['password', 'token', 'secret'];
    for (const key in obj) {
      if (fieldsToMask.includes(key)) obj[key] = '***MASKED***';
      else if (typeof obj[key] === 'object') mask(obj[key]);
    }
  };
  mask(info);
  return info;
});

const fileFormat = format.combine(
  maskFormat(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.json()
);

const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'HH:mm:ss' }),
  format.printf(({ timestamp, level, message, service, ...meta }) => {
    return `${timestamp} [${service}] ${level}: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    }`;
  })
);

export const logger: Logger = createLogger({
  level: isProduction ? 'info' : 'debug',
  defaultMeta: { service: SERVICE_NAME },
  transports: [

    new transports.Console({
      format: isProduction ? format.json() : consoleFormat,
    }),


    new DailyRotateFile({
      level: 'error',
      filename: path.join(logPath, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: fileFormat,
    }),

  
    new DailyRotateFile({
      level: 'info',
      filename: path.join(logPath, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d',
      format: fileFormat,
    }),
  ],
});