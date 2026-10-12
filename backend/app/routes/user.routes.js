import { Router } from "express";
import userController from "../controllers/user.controller.js";
import { authenticate, requireFaculty } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate, requireFaculty], userController.findAll);
router.get("/:id", [authenticate], userController.findOne);
router.put("/:id", [authenticate], userController.update);

export default router;
