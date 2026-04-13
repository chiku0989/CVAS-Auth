import {Schema, model, type Document, type CallbackError, Types } from "mongoose"
import bcrypt from "bcrypt";
import { ARMY_RANKS, CVAS_PATTERNS } from "../utils/constants.js";
import { UserRole } from "../utils/constants.js";
import { authPool } from "../workers/index.js";
import { TASK } from "../workers/password.worker.js";
import type { StringValidation } from "zod/v3";

export interface UserInterface extends Document {
    serviceNumber : string;
    rank : string,
    name : string,
    password : string;
    unit : string;
    isDeleted : boolean;
    checkpoint :Schema.Types.ObjectId;
    role : UserRole;
    comparePassword(password : string) : Promise<boolean>;
}



const userSchema = new Schema<UserInterface>(
    {
serviceNumber: {
            type: String,
            required: [true, "Service Number is Required"],
            unique: true,
            trim: true,
            uppercase: true, 
            validate: {
                validator: (v: string) => CVAS_PATTERNS.SERVICE_NUMBER.regex.test(v),
                message: CVAS_PATTERNS.SERVICE_NUMBER.message
            }
        },

        rank: {
            type: String,
            required: [true, "Rank is Required"],
            trim: true,
            uppercase: true, 
            enum: {
                values: ARMY_RANKS,
                message: '{VALUE} is not a valid Army Rank'
            }
        },

        checkpoint: {
            type: Types.ObjectId,
            default: null,
            ref : "Checkpoint"
        },

        name: {
            type: String,
            required: [true, "Name is Required"],
            uppercase: true, 
            trim: true,
            minlength: [2, "Name is too short"]
        },

        password : {
            type: String,
            required: [true, "Password is required"],
            minlength: 8,
            select: false, 
        },

        unit : {
            type: String,
            required: [true, "Unit is required"],
            uppercase: true,
            select: true, 
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },


        role: {
            type: String,
            enum: Object.values(UserRole), 
            required: true
        },
    },
    { 
    timestamps: true

  }
);


userSchema.pre<UserInterface>("save", async function () {
  if (!this.isModified("password")) return;
  try {

    this.password = await authPool.run({task : TASK.HASH , password : this.password})
  } catch (err: any) { 
    throw err; 
  }
});

userSchema.methods.comparePassword = async function (password : string) : Promise<boolean> {
    const user = this as UserInterface;
    return await authPool.run({task : TASK.COMPARE , password : password, hash : user.password});
}

export const User = model<UserInterface>("User", userSchema);