import { Queue } from 'bullmq';
import getConnection from './queue.js';
import { logger } from '../utils/log.js';
import type { Types } from 'mongoose';
import type { UserRole } from '../utils/constants.js';

export enum ACTION_TYPE {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE'
}

// Define the services that need to stay in sync with User data
const REPLICATION_QUEUES = [
    'user-sync-checkpoint-service',
    'user-sync-vehicle-service',
];

const JOB_NAME = 'sync-user-data';

interface UserData {
    _id: Types.ObjectId;
    serviceNumber: string;
    name: string;
    rank: string;
    role: UserRole;
}

interface SyncJobPayload {
    type: ACTION_TYPE;
    data: UserData;
    timestamp: string;
}

// Initialize all the queues
const queues = REPLICATION_QUEUES.map(queueName => {
    return new Queue<SyncJobPayload>(queueName, {
        connection: getConnection() as any,
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: true
        }
    });
});

export const syncUserToCheckpoint = async (actionType: ACTION_TYPE, data: UserData): Promise<void> => {
    const payload: SyncJobPayload = {
        type: actionType,
        data: data,
        timestamp: new Date().toISOString()
    };

    // Use Promise.all to add the job to all queues in parallel
    try {
        await Promise.all(
            queues.map(queue => queue.add(JOB_NAME, payload))
        );

        logger.info(`[Queue Fan-out] Synced ${actionType} for User ${data.serviceNumber} to ${REPLICATION_QUEUES.length} services`);
    } catch (error) {
        logger.error(`[Queue Error] Failed to broadcast user sync: ${error}`);

        throw error;
    }
};