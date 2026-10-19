import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import semesterRoutes from "./semester.routes.js";
import enrollmentRoutes, { studentRouter as studentEnrollmentRoutes } from "./enrollment.routes.js";
import sectionRoutes from "./section.routes.js";
import facultyRoutes from "./faculty.routes.js";
import courseRoutes from "./course.routes.js";
import academicRoutes from "./academic.routes.js";

const router = Router();

router.use("/", authRoutes);
router.use("/users", userRoutes);
router.use("/semesters", semesterRoutes);
router.use("/students/:studentId/enrollments", studentEnrollmentRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/sections", sectionRoutes);
router.use("/faculty", facultyRoutes);
router.use("/courses", courseRoutes);
router.use("/academic", academicRoutes);

export default router;