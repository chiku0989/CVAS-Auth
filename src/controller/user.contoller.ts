import { type Request, type Response } from "express";
import { User, type UserInterface } from "../models/user.model.js";
import response from "../utils/response.js";
import { logger } from "../utils/log.js";
import jwt from "jsonwebtoken";
import { UserRole } from "../utils/constants.js";
import { env } from "../config/env.js";
import { cache, CACHE_TYPES } from "../database/cache.js";
import { ACTION_TYPE, syncUserToCheckpoint } from "../queues/userReplicationQueue.js";
import {Checkpoint} from "../models/checkpoint.model.js"
import { Types } from "mongoose";


export interface UserSession {
  id: string;           
  serviceNumber: string;
  name: string;
  role: UserRole;
  rank: string;
  unit : string;
  checkpoint: string | Types.ObjectId;     
  token?: string;        
}

export const registerHandler = async (req: Request, res: Response) => {
  try {
    const { serviceNumber, rank, name, password,unit,  role } = req.body;

    const existingUser = await User.findOne({ serviceNumber });

    if (existingUser) {
      logger.warn(
        `Registration attempt failed: Service Number ${serviceNumber} already exists.`
      );

      return response(
        res,
        false,
        `Registration failed: An account with this Service Number ${serviceNumber} is already registered`,
        {},
        409
      );
    }

    const newUser = new User({
      serviceNumber,
      rank,
      name,
      password,
      unit,
      role,
      isDeleted: false,
    });

    await newUser.save();
    logger.info(`User Created Successfully`, {
      serviceNumber: newUser.serviceNumber,
      rank: newUser.rank,
      name: newUser.name,
      role: newUser.role,
    });

    try {
            await syncUserToCheckpoint(ACTION_TYPE.CREATE, {
                _id : newUser._id,
                serviceNumber: newUser.serviceNumber,
                rank: newUser.rank,
                name: newUser.name,
                role: newUser.role,
            });

        } catch (queueError) {
            logger.error(`FAILED to push user ${newUser._id} to checkpoint queue`, queueError);
        }

    await cache.clearByType(CACHE_TYPES.LIST);

    return response(
      res,
      true,
      "User Created Successfully",
      {
        serviceNumber: newUser.serviceNumber,
        rank: newUser.rank,
        name: newUser.name,
        role: newUser.role,
      },
      201
    );
  } catch (error: any) {
    logger.error(`Registration error: ${error.message}`, {
      stack: error.stack,
    });
    return response(
      res,
      false,
      "Internal Server Error during registration",
      { error: error.message },
      500
    );
  }
};

export const loginHandler = async (req: Request, res: Response) => {
  try {
    const { serviceNumber, password } = req.body;
    

    const user =  await User.findOne({ serviceNumber }).select("+password").populate("checkpoint");
    console.log(user);
    if (!user) {
      return response(res, false, "Invalid credentials", {}, 401);
    }

    const isValid = await user.comparePassword(password);

    if (!isValid) {
      return response(res, false, "Invalid credentials", {}, 401);
    }

    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
    const hasCheckpoint =
      user.checkpoint && user.checkpoint !== null;

    if (!isSuperAdmin && !hasCheckpoint) {
      logger.warn(
        `Login blocked: Worker ${user.serviceNumber} has no checkpoint assigned.`
      );
      return response(
        res,
        false,
        "Login denied: No checkpoint assigned. Please contact your administrator.",
        {},
        403
      );
    }

    const cachePayload : UserSession = {
      id: user._id.toString(),
      serviceNumber : user.serviceNumber,
      name : user.name,
      role: user.role,
      rank: user.rank,
      unit : user.unit,
      checkpoint: isSuperAdmin ? "GLOBAL" : (user.checkpoint as any)._id,
    };


    const token = jwt.sign({serviceNumber : cachePayload.serviceNumber },env.JWT_SECRET , {
      algorithm: "HS256",
      expiresIn: "12h",
    });

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 12 * 60 * 60 * 1000,
      path: "/",
    });

    await cache.set('session', user.serviceNumber, {
      token,
      ...cachePayload,
      name: user.name
    }, 43200);

    logger.info(
      `Successful Login: ${user.serviceNumber} (${user.role}) at ${cachePayload.checkpoint}`
    );

    return response(
      res,
      true,
      "Login successful",
      {
        user: {
          serviceNumber : user.serviceNumber,
          name: user.name,
          rank: user.rank,
          role: user.role,
          checkpoint: cachePayload.checkpoint,
          checkpointName : isSuperAdmin ? 'GLOBAL' : (user.checkpoint as any).name
        },
      },
      200
    );
  } catch (error: any) {
    logger.error(`Login error: ${error.message}`);
    return response(res, false, "Internal Server Error", {}, 500);
  }
};


export const getCheckpointAdminHandler = async (req : Request , res : Response)=>{
  try {
    const userData = req.header('x-user-data');
    if( !userData ) return response(res, false, "Invalid headers", {} , 401)
    
    const user = JSON.parse(userData as string)

    const userDetails : UserSession | null = await cache.get(CACHE_TYPES.SESSION, user.serviceNumber)

    if(!userDetails) return response(res, false, "Session Expired", {}, 401)

    if(userDetails.role != UserRole.SUPER_ADMIN) return  response(res, false, "Access Denied: You do not have the required permissions to perform this action.", {} , 403)

    const { cursor = null, limit = 10 } = req.query;
    const parsedLimit = Math.min(parseInt(limit as string) || 10, 50);
    const cacheKey = `checkpoint_admins:${cursor}:${parsedLimit}`;

    const cachedData = await cache.get(CACHE_TYPES.LIST, cacheKey);
    if (cachedData) {
      return response(res, true, 'Checkpoint Admins fetched successfully (cache)', cachedData, 200);
    }

    const query: any = {
      role: UserRole.CHECKPOINT_ADMIN,
      checkpoint: null
    };

    if (cursor && cursor !== 'null') {
      if (!Types.ObjectId.isValid(cursor as string)) {
        return response(res, false, 'Invalid cursor', {}, 400);
      }

      query._id = { $lt: new Types.ObjectId(cursor as string) };
    }

    const adminList = await User.find(query)
      .sort({ _id: -1 })
      .limit(parsedLimit);

    const lastAdmin = adminList[adminList.length - 1];
    const nextCursor = adminList.length === parsedLimit && lastAdmin ? lastAdmin._id : null;

    const result = {
      adminList,
      nextCursor,
    };

    await cache.set(CACHE_TYPES.LIST, cacheKey, result, 1800);

    response(res, true,'Checkpoint Admins fetched successfully', result, 200);
  } catch (e){
    return response(res, false, "Internal Server Error", {}, 500)
  }
}

export const getWorkersHandler = async (req : Request , res : Response)=>{
  try {
    const userData = req.header('x-user-data');
    if( !userData ) return response(res, false, "Invalid headers", {} , 401)
    
    const user = JSON.parse(userData as string)

    if(user.role != UserRole.SUPER_ADMIN && user.role != UserRole.CHECKPOINT_ADMIN) return  response(res, false, "Access Denied: You do not have the required permissions to perform this action.", {} , 403)

    const { cursor = null, limit = 10 } = req.query;
    const parsedLimit = Math.min(parseInt(limit as string) || 10, 50);
    const cacheKey = `unassigned_workers:${cursor}:${parsedLimit}`;

    const cachedData = await cache.get(CACHE_TYPES.LIST, cacheKey);
    if (cachedData) {
      return response(res, true, 'Workers fetched successfully (cache)', cachedData, 200);
    }

    const query: any = {
      role: UserRole.WORKER,
      checkpoint: null,
    };

    if (cursor && cursor !== 'null') {
      if (!Types.ObjectId.isValid(cursor as string)) {
        return response(res, false, 'Invalid cursor', {}, 400);
      }

      query._id = { $lt: new Types.ObjectId(cursor as string) };
    }

    const workers = await User.find(query)
      .sort({ _id: -1 })
      .limit(parsedLimit);

    const lastWorker = workers[workers.length - 1];
    const nextCursor = workers.length === parsedLimit && lastWorker ? lastWorker._id : null;

    const result = {
      workers,
      nextCursor,
    };

    await cache.set(CACHE_TYPES.LIST, cacheKey, result, 1800);

    logger.info(`Unassigned workers fetched successfully`, { count: workers.length, cursor, limit: parsedLimit });

    response(res, true, 'Workers fetched successfully', result, 200);
  } catch (e: any){
    logger.error(`Error fetching workers: ${e.message}`, { stack: e.stack });
    return response(res, false, "Internal Server Error", {}, 500)
  }
}