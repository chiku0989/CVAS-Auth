import {Schema, Types, model, type Document } from "mongoose"

export interface CheckpointInterface extends Document {
    _id: Types.ObjectId;
    name: string;
    location?: string;
    isDeleted: boolean;
}

const checkpointSchema = new Schema<CheckpointInterface>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            uppercase: true,
            trim: true,
            unique: true
        },
        location: {
            type: String,
            trim: true
        },
        isDeleted: {
            type: Boolean,
            default: false
        },

    },
    { timestamps: true }
)

export const Checkpoint = model<CheckpointInterface>("Checkpoint", checkpointSchema);