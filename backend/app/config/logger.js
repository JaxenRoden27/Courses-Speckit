import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const levels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
const colors = { error: "red", warn: "yellow", info: "green", http: "magenta", debug: "white" };
winston.addColors(colors);

const level = () => (process.env.NODE_ENV === "development" ? "debug" : "warn");

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }),
  new DailyRotateFile({ filename: "logs/error-%DATE%.log", datePattern: "YYYY-MM-DD", level: "error" }),
  new DailyRotateFile({ filename: "logs/all-%DATE%.log", datePattern: "YYYY-MM-DD" }),
];

const logger = winston.createLogger({ level: level(), levels, format, transports });
logger.stream = { write: (message) => logger.http(message.trim()) };

export default logger;
