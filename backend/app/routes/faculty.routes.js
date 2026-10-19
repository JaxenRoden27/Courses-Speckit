import { Router } from "express";
import facultyController from "../controllers/faculty.controller.js";
import { authenticate, requireFaculty } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate], facultyController.findAll);
router.post("/", [authenticate, requireFaculty], facultyController.create);
router.put("/:facultyId", [authenticate, requireFaculty], facultyController.update);
router.delete("/:facultyId", [authenticate, requireFaculty], facultyController.remove);

export default router;