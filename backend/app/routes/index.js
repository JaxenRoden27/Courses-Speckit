import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Register feature routers here as you implement them, e.g.:
// import authRoutes from "./auth.routes.js";
// router.use("/", authRoutes);

export default router;
