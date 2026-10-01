import { Router } from "express";
import sectionController from "../controllers/section.controller.js";
import { authenticateFaculty } from "../authorization/authorization.js";

const router = Router();

router.get("/sections", [authenticateFaculty], sectionController.findAll);
router.post("/sections", [authenticateFaculty], sectionController.createSection);
router.put("/sections/:sectionId", [authenticateFaculty], sectionController.updateSection);
router.delete("/sections/:sectionId", [authenticateFaculty], sectionController.removeSection);

export default router;