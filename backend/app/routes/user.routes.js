import { Router } from "express";
import userController from "../controllers/user.controller.js";
import { authenticateStudent } from "../authorization/authorization.js";
import { authenticateFaculty } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticateStudent] || [authenticateFaculty], userController.findAll);
router.get("/:id", [authenticateStudent] || [authenticateFaculty], userController.findOne);
router.put("/:id", [authenticateStudent] || [authenticateFaculty], userController.update);

export default router;
