import { Router } from "express";
import semesterController from "../controllers/semester.controller.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate], semesterController.findAll);
router.post("/", [authenticate], semesterController.create);
router.put("/:semesterId", [authenticate], semesterController.update);
router.delete("/:semesterId", [authenticate], semesterController.remove);
export default router;