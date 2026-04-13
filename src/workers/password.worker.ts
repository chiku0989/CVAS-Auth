import bcrypt from 'bcrypt';


export const TASK = {
  HASH: 'hash',
  COMPARE: 'compare'
} as const;

export type TASK = typeof TASK[keyof typeof TASK];

interface WorkerPayload {
    task : TASK,
    password : string,
    hash? : string
}

export default async ({ task, password, hash } : WorkerPayload) => {
    if (task === TASK.HASH) {
        const salt = await bcrypt.genSalt(12);
        return await bcrypt.hash(password, salt);
    } 
    
    if (task === TASK.COMPARE ) {
        return await bcrypt.compare(password, hash!);
    }

    throw new Error('Invalid task');
};