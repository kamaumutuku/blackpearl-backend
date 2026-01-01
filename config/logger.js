import winston from "winston";
import "winston-mongodb";
import dotenv from "dotenv";

dotenv.config();

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Define log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
  level: "info",
  format: combine(
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new winston.transports.Console(),

    // 🧾 Log to file
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),

    // 🗄️ Log errors to MongoDB
    new winston.transports.MongoDB({
      db: process.env.MONGO_URI,
      options: { useUnifiedTopology: true },
      collection: "system_logs",
      level: "error",
      tryReconnect: true,
    }),
  ],
});

// If not in production, also log to console
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    })
  );
}

export default logger;
