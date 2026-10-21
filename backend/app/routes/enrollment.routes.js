import { Router } from "express";
import enrollmentController from "../controllers/enrollment.controller.js";
import { authenticate, authenticateFaculty, authenticateStudent } from "../authorization/authorization.js";

const studentRouter = Router({ mergeParams: true });

studentRouter.get("/", [authenticate], enrollmentController.findForStudent);
studentRouter.post("/", [authenticateStudent], enrollmentController.create);
studentRouter.put("/:enrollmentId", [authenticateStudent], enrollmentController.update);
studentRouter.delete("/:enrollmentId", [authenticateStudent], enrollmentController.remove);

const router = Router();

router.get("/", [authenticateFaculty], enrollmentController.findAll);

export { studentRouter };
export default router;