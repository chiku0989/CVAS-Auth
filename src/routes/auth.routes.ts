import express, {type Router} from "express";
import { jsonValidatorMiddler, patternValidator } from "../middlewares/validators.js";
import {registerHandler, loginHandler, getCheckpointAdminHandler, getWorkersHandler} from '../controller/user.contoller.js'
import {CVAS_PATTERNS} from '../utils/constants.js'

const router : Router  = express.Router();



router.post('/register', jsonValidatorMiddler(['serviceNumber','rank', 'name','password', 'unit' , 'role']), patternValidator({serviceNumber : CVAS_PATTERNS.SERVICE_NUMBER , rank : CVAS_PATTERNS.RANK, password : CVAS_PATTERNS.PASSWORD, role : CVAS_PATTERNS.REGISTRATION_ROLES}), registerHandler)
router.post('/login',jsonValidatorMiddler(['serviceNumber', 'password']),patternValidator({serviceNumber : CVAS_PATTERNS.SERVICE_NUMBER , password : CVAS_PATTERNS.PASSWORD}), loginHandler)

router.get('/checkpoint-admins', getCheckpointAdminHandler);
router.get('/workers', getWorkersHandler);


export default router