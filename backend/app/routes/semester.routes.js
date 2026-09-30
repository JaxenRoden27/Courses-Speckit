import { Router } from "express";
import semesterController from "../controllers/semester.controller.js";
import { authenticateStudent, authenticateFaculty } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticateStudent] || [authenticateFaculty], semesterController.findAll);
router.post("/", [authenticateStudent] || [authenticateFaculty], semesterController.create);
router.put("/:semesterId", [authenticateStudent] || [authenticateFaculty], semesterController.update);
router.delete("/:semesterId", [authenticateStudent] || [authenticateFaculty], semesterController.remove);
export default router;