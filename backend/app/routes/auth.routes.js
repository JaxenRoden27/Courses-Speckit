import { Router } from "express";
import authController from "../controllers/auth.controller.js";
import { authenticateStudent, authenticateFaculty } from "../authorization/authorization.js";
import semesterController from "../controllers/semester.controller.js";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", [authenticateStudent] || [authenticateFaculty], authController.logout);
router.get("/", [authenticateStudent] || [authenticateFaculty], semesterController.findAll);
router.post("/", [authenticateStudent], semesterController.create);
router.put("/:semesterId", [authenticateStudent], semesterController.update);
router.delete("/:semesterId", [authenticateStudent], semesterController.remove);
export default router;
