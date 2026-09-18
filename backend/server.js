import routes from "./app/routes/index.js";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import db from "./app/models/index.js";
import logger from "./app/config/logger.js";

const shouldAlterSchema =
  process.env.SEQUELIZE_SYNC_ALTER === "true" ||
  process.env.SEQUELIZE_SYNC_ALTER === "1" ||
  (process.env.NODE_ENV === "development" && process.env.SEQUELIZE_SYNC_ALTER !== "false");

const syncOptions = shouldAlterSchema ? { alter: true } : {};

if (process.env.NODE_ENV !== "test") {
  db.sequelize
    .sync(syncOptions)
    .then(() => {
      if (syncOptions.alter) {
        logger.info("Database sync completed with alter: true.");
      }
    })
    .catch((err) => {
      logger.error(`Database sync failed: ${err.message}`);
      process.exit(1);
    });
}

const app = express();

app.use(morgan("combined", { stream: logger.stream }));

app.use(
  cors({
    origin: "http://localhost:8082",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", routes);

const PORT = process.env.PORT || 3200;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    logger.info(`Speckit App API running on port ${PORT}`);
  });
}

export { logger };
export default app;
