import { Router } from "express";
import courseController from "../controllers/course.controller.js";
import { authenticateFaculty, authenticate } from "../authorization/authorization.js";

const router = Router();
router.get("/", [authenticate], courseController.findAll);
router.get("/:courseId", [authenticate], courseController.findOne);
router.post("/", [authenticateFaculty], courseController.create);
router.put("/:courseId", [authenticateFaculty], courseController.update);
router.delete("/:courseId", [authenticateFaculty], courseController.remove);
export default router;