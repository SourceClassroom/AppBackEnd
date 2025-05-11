import express from "express"
import *as healthController from "../controller/healthController.js"

const router = express.Router()

router.route("/").get(
    healthController.healthCheck
)

export default router;
