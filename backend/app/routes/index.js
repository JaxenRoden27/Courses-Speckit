import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import semesterRoutes from "./semester.routes.js";
import sectionRoutes from "./section.routes.js";
import facultyRoutes from "./faculty.routes.js";
import courseRoutes from "./course.routes.js";

const router = Router();

router.use("/", authRoutes);
router.use("/users", userRoutes);
router.use("/semesters", semesterRoutes);
router.use("/sections", sectionRoutes);
router.use("/faculty", facultyRoutes);
router.use("/courses", courseRoutes);

export default router;