import { Redis, type RedisOptions } from 'ioredis'
import {env} from "../config/env.js"
import { logger } from '../utils/log.js';

const connectionProperties : RedisOptions ={
    maxRetriesPerRequest: null,
    enableReadyCheck: false, 
}

let connection : Redis | null = null;

const getConnection = () : Redis =>{
    if(connection == null){
        connection = new Redis(env.REDIS_URL ,connectionProperties)
        connection.on('error', (err) => {
             logger.error('Redis connection error:', err);
        });
    }

    return connection;
}

export default getConnection