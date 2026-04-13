import mongoose from "mongoose";
import { logger } from "../utils/log.js";
import { env } from "../config/env.js";

const MONGO_URI : string = env.MONGO_URI || 'mongodb://localhost:27017/CVAS'

const connectDB = async ()=>{
    try{
        const conn = await mongoose.connect(MONGO_URI)
        logger.info(`Auth-Service connected to MongoDB ${conn.connection.host}`)
    } catch(err : any){
            logger.error(err.message)
    }
}

export default connectDB