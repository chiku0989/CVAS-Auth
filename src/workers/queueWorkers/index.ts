import { startAssignCheckpointWorker } from "./assign-checkpoint-sync.js"
import { startCheckpointSyncWorker } from "./checkpoint-sync.worker.js"

export const startWorkers = () : void => {
    startCheckpointSyncWorker()
    startAssignCheckpointWorker()
}