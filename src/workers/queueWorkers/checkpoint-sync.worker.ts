import {Worker, Job} from 'bullmq'
import getConnection from '../../queues/queue.js'
import * as CheckpointService from '../../services/checkpoint-sync.service.js'
import { logger } from '../../utils/log.js'
import type { Types } from 'mongoose'


export enum ACTION_TYPE {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE'
}


export interface CheckpointData {
    _id : Types.ObjectId
    name : string,
    location : string,
    isDelete : boolean
}

interface SyncJobPayload {
    type: ACTION_TYPE;
    data: CheckpointData;
    timestamp: string;
}

const QUEUE_NAME = 'replicate-checkpoint-auth-service';

export const startCheckpointSyncWorker = ()=>{
    const worker = new Worker<SyncJobPayload>(
        QUEUE_NAME,
        async (job : Job<SyncJobPayload>)=>{
            const   {type , data} = job.data;

            try {
                       
            switch (type) {
                case ACTION_TYPE.CREATE:
                    await CheckpointService.createCheckpoint(data);
                    break;

                case ACTION_TYPE.UPDATE:
                    await CheckpointService.updateCheckpoint(data);
                    break;
                
                case ACTION_TYPE.DELETE :
                    await CheckpointService.deleteCheckpoint(data);
                
                default:
                    logger.warn(`[Worker] Unknown action type: ${type}`);
            }
            } catch(error : any){
                logger.error(`[Worker] Failed job ${job.id}`, error)
            }

        },
        {
            connection : getConnection() as any,
            concurrency : 5,
            limiter : {
                max : 10,
                duration : 1000
            }
        }
    )
}