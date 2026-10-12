import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import semesterRoutes from "./semester.routes.js";
import courseRoutes from "./course.routes.js";

const router = Router();

router.use("/", authRoutes);
router.use("/users", userRoutes);
router.use("/semesters", semesterRoutes);
router.use("/courses", courseRoutes);

export default router;
