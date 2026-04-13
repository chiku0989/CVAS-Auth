import type { Schema, Types } from 'mongoose';
import {User} from '../models/user.model.js'
import { logger } from '../utils/log.js'
import { cache, CACHE_TYPES } from '../database/cache.js';

export interface Data {
    user_id : Types.ObjectId;
    checkpoint_id : Types.ObjectId | null;
}

export const updateUserCheckpoint = async (data: Data) => {
    const updatedUser = await User.findOneAndUpdate(
        { _id: data.user_id },
        { checkpoint : data.checkpoint_id },
        { new: true }
    );

    await cache.clearByType(CACHE_TYPES.LIST);

    if (updatedUser?.serviceNumber) {
        await cache.del(CACHE_TYPES.SESSION, updatedUser.serviceNumber);
    }

    logger.info(`Synced update for user: ${data.user_id}`);
};