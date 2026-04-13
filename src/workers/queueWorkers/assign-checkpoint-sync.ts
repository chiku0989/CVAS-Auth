import { Job, Worker } from 'bullmq'
import getConnection from '../../queues/queue.js'
import { logger } from '../../utils/log.js'
import type {Types} from 'mongoose'
import { updateUserCheckpoint } from "../../services/assign_checkpoint-sync.js"

export enum ACTION_TYPE {
    UPDATE = 'UPDATE',
    CREATE = 'CREATE'
}

export interface Data {
    user_id : Types.ObjectId,
    checkpoint_id : Types.ObjectId | null
}

const QUEUE_NAME = 'replicate-assign-auth-service';


interface SyncJobPayload {
    type : ACTION_TYPE;
    data : Data;
    timestamp : string;
}


export const startAssignCheckpointWorker = ()=>{
    const worker = new Worker<SyncJobPayload>(
        QUEUE_NAME, 
        async (job : Job<SyncJobPayload>)=>{
             const   {type , data} = job.data;
            
             if(type == ACTION_TYPE.UPDATE){
                await updateUserCheckpoint(data)
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