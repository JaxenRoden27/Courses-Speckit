import { Router } from "express";
import facultyController from "../controllers/faculty.controller.js";
import { authenticate, authenticateFaculty } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate], facultyController.findAll);
router.post("/", [authenticateFaculty], facultyController.create);
router.put("/:facultyId", [authenticateFaculty], facultyController.update);
router.delete("/:facultyId", [authenticateFaculty], facultyController.remove);

export default router;