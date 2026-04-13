import type { Schema, Types } from 'mongoose';
import {Checkpoint} from '../models/checkpoint.model.js'
import { logger } from '../utils/log.js'

export interface CheckpointData {
    _id : Types.ObjectId
    name : string,
    location : string,
    isDelete : boolean
}

export const createCheckpoint = async (data: CheckpointData) => {
    const existing = await Checkpoint.findById(data._id)
    if (existing) {
        logger.warn(`User ${data._id} checkpoint already exists . Skipping.`);
        return;
    }

    await Checkpoint.create({
        _id : data._id,
        name : data.name,
        location : data.location,
        isDeleted : data.isDelete

    });
    logger.info(`Synced new checkpoint: ${data._id}`);
};

export const updateCheckpoint = async (data: CheckpointData) => {
    await Checkpoint.findOneAndUpdate(
        { _id: data._id },
        {name : data.name,
        location : data.location,
        isDeleted : data.isDelete },
        { upsert: true }
    );
    logger.info(`Synced update for Checkpoint: ${data._id}`);
};

export const deleteCheckpoint = async (data : CheckpointData) => {
    await Checkpoint.findOneAndDelete({_id : data._id})
}