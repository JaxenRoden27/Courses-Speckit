import { Router } from "express";
import sectionController from "../controllers/section.controller.js";
import { authenticate, requireFaculty } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate], sectionController.findAll);
router.post("/", [authenticate, requireFaculty], sectionController.create);
router.put("/:sectionId", [authenticate, requireFaculty], sectionController.update);
router.delete("/:sectionId", [authenticate, requireFaculty], sectionController.remove);

export default router;