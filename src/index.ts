import express, { type Application, type Request, type Response } from "express";

import { requestLogger } from "./middlewares/requestLoggerMiddleware.js";
import connectDB from "./database/database.js";
import { logger } from "./utils/log.js";
import router from "./routes/auth.routes.js";
import response from "./utils/response.js";
import { env } from "./config/env.js";
import { connectRedis } from "./database/cache.js";
import { startWorkers } from "./workers/queueWorkers/index.js" 


const app : Application = express();

app.use(requestLogger)
app.use(express.json())
connectDB();
connectRedis();
app.use(express.urlencoded({ extended: true }))


app.use('/', router)

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
        return response(
            res,
            false,
            "Invalid JSON syntax. Please check for missing commas or quotes.",
            {},
            400
        );
    }
    next();
});

startWorkers()

app.listen(env.PORT , ()=>{
    logger.info(`Auth-Service Running at port ${env.PORT}`);
})
