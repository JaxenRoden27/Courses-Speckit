import { Router } from "express";
import academicController from "../controllers/academic.controller.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

// Student course routes (Feature 7)
router.get("/students/:studentId/courses", [authenticate], academicController.getStudentCourses);
router.post("/students/:studentId/courses", [authenticate], academicController.enrollStudentCourse);
router.put("/enrollments/:enrollmentId", [authenticate], academicController.updateEnrollment);
router.put("/:enrollmentId", [authenticate], academicController.updateEnrollment);

// Section student routes (Feature 8)
router.get("/sections", [authenticate], academicController.getSections);
router.get("/sections/:sectionId/students", [authenticate], academicController.getSectionStudents);
router.post("/sections/:sectionId/students", [authenticate], academicController.enrollSectionStudent);

export default router;
