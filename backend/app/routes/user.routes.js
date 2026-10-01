import { Router } from "express";
import userController from "../controllers/user.controller.js";
import { authenticate, authenticateStudent, authenticateFaculty, requireFaculty } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate, requireFaculty], userController.findAll);
router.get("/:id", [authenticateStudent] || [authenticateFaculty], userController.findOne);
router.put("/:id", [authenticateStudent] || [authenticateFaculty], userController.update);

export default router;