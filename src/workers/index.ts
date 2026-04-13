import {Piscina} from 'piscina';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const authPool = new Piscina({
    
    filename: path.resolve(__dirname, 'password.worker.ts'),
    minThreads: 2,
    maxThreads: 4
});