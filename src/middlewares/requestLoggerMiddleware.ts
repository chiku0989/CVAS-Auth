import { type Request, type Response, type NextFunction } from 'express';
import { logger } from '../utils/log.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();


  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`HTTP ${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip
    });
  });

  next();
};