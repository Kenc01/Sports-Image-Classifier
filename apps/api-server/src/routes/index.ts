import { Router, type IRouter } from "express";
import healthRouter from "./health";
import classifierRouter from "./classifier";

const router: IRouter = Router();

router.use(healthRouter);
router.use(classifierRouter);

export default router;
