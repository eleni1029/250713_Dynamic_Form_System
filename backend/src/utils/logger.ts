import winston from 'winston'

const { combine, timestamp, errors, json, simple, colorize } = winston.format

export const createLogger = () => {
  const isProduction = process.env.NODE_ENV === 'production'
  
  const logger = winston.createLogger({
    level: isProduction ? 'info' : 'debug',
    format: combine(
      timestamp(),
      errors({ stack: true }),
      json()
    ),
    defaultMeta: { service: 'dynamic-form-backend' },
    transports: [
      new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      new winston.transports.File({ 
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    ]
  })

  if (!isProduction) {
    logger.add(new winston.transports.Console({
      format: combine(
        colorize(),
        simple()
      )
    }))
  }

  return logger
}

export default createLogger()