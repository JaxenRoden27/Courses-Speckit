import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import semesterRoutes from "./semester.routes.js";
import enrollmentRoutes, { studentRouter as studentEnrollmentRoutes } from "./enrollment.routes.js";

const router = Router();

router.use("/", authRoutes);
router.use("/users", userRoutes);
router.use("/semesters", semesterRoutes);
router.use("/students/:studentId/enrollments", studentEnrollmentRoutes);
router.use("/enrollments", enrollmentRoutes);

export default router;
