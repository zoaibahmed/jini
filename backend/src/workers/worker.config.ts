import { Queue as BullQueue, Worker as BullWorker, QueueEvents as BullQueueEvents } from 'bullmq';
import { Logger } from '@nestjs/common';

const logger = new Logger('BullMQConfig');

const isRedisEnabled = process.env.REDIS_ENABLED === 'true';

// Global registries for Mock Mode
const globalWorkerRegistry = new Map<string, (job: any) => Promise<any>>();
const globalQueueJobs = new Map<string, any[]>();

class MockQueue {
  constructor(public name: string, public opts?: any) {
    logger.log(`[MockQueue] Initialized in-memory queue: "${name}"`);
  }

  async add(jobName: string, data: any, opts?: any) {
    const jobId = Math.random().toString(36).substring(2, 9);
    logger.log(`[MockQueue] Job added to "${this.name}": ID=${jobId} Name=${jobName}`);
    
    const job = {
      id: jobId,
      name: jobName,
      data,
      opts,
      attemptsMade: 0,
    };

    if (!globalQueueJobs.has(this.name)) {
      globalQueueJobs.set(this.name, []);
    }
    globalQueueJobs.get(this.name)!.push(job);

    const delay = (opts && typeof opts.delay === 'number') ? opts.delay : 100;

    // Asynchronously dispatch to worker
    setTimeout(async () => {
      // Remove from pending queue jobs once processed
      const jobs = globalQueueJobs.get(this.name) || [];
      const idx = jobs.findIndex(j => j.id === jobId);
      if (idx > -1) {
        jobs.splice(idx, 1);
      }

      const workerProcessor = globalWorkerRegistry.get(this.name);
      if (workerProcessor) {
        try {
          logger.log(`[MockQueue] Dispatching Job ID=${jobId} to worker for "${this.name}"`);
          await workerProcessor(job);
        } catch (err: any) {
          logger.error(`[MockQueue] Job ID=${jobId} failed in worker: ${err.message}`);
        }
      } else {
        logger.warn(`[MockQueue] No active worker registered for queue "${this.name}". Job ID=${jobId} remains in-memory.`);
      }
    }, delay);

    return job;
  }
}

class MockWorker {
  constructor(
    public name: string,
    public processor: (job: any) => Promise<any>,
    public opts?: any
  ) {
    logger.log(`[MockWorker] Registered in-memory worker for queue: "${name}"`);
    globalWorkerRegistry.set(name, processor);

    // Process pre-existing queued jobs
    setTimeout(() => {
      const pendingJobs = globalQueueJobs.get(name) || [];
      if (pendingJobs.length > 0) {
        logger.log(`[MockWorker] Processing ${pendingJobs.length} pending jobs for "${name}"`);
        pendingJobs.forEach(job => {
          processor(job).catch(err => logger.error(`Pending job ID=${job.id} failed: ${err.message}`));
        });
        globalQueueJobs.set(name, []);
      }
    }, 500);
  }

  async close() {
    logger.log(`[MockWorker] Closed in-memory worker for queue: "${this.name}"`);
    globalWorkerRegistry.delete(this.name);
  }
}

class MockQueueEvents {
  constructor(public name: string, public opts?: any) {}
  on(event: string, callback: (...args: any[]) => void) {
    return this;
  }
}

// Export the selected classes based on flag
export const Queue = isRedisEnabled ? BullQueue : MockQueue;
export const Worker = isRedisEnabled ? BullWorker : MockWorker;
export const QueueEvents = isRedisEnabled ? BullQueueEvents : MockQueueEvents;

export const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

// Define default configuration for job retries, backoff, and processing delay options
export const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000, // wait 5 seconds before first retry
  },
  removeOnComplete: { age: 3600 }, // clean jobs completed older than 1 hr
  removeOnFail: { age: 86400 * 7 }, // keep failures for 7 days
};

// Define Queues mapping with both uppercase and lowercase properties for compatibility
export const Queues: Record<string, any> = {
  emails: new Queue('emails', { connection: redisConnection, defaultJobOptions }) as any,
  sms: new Queue('sms', { connection: redisConnection, defaultJobOptions }) as any,
  reminders: new Queue('reminders', { connection: redisConnection, defaultJobOptions }) as any,
  notifications: new Queue('notifications', { connection: redisConnection, defaultJobOptions }) as any,
  ai_jobs: new Queue('ai_jobs', { connection: redisConnection, defaultJobOptions }) as any,
  uploads: new Queue('uploads', { connection: redisConnection, defaultJobOptions }) as any,
  voice_tasks: new Queue('voice_tasks', { connection: redisConnection, defaultJobOptions }) as any,
  
  EMAILS: null as any,
  SMS: null as any,
  REMINDERS: null as any,
  NOTIFICATIONS: null as any,
  AI_JOBS: null as any,
  UPLOADS: null as any,
  VOICE_TASKS: null as any,
};

Queues.EMAILS = Queues.emails;
Queues.SMS = Queues.sms;
Queues.REMINDERS = Queues.reminders;
Queues.NOTIFICATIONS = Queues.notifications;
Queues.AI_JOBS = Queues.ai_jobs;
Queues.UPLOADS = Queues.uploads;
Queues.VOICE_TASKS = Queues.voice_tasks;

// Event trackers
export function initializeQueueEventTracker(queueName: string) {
  const qEvents = new QueueEvents(queueName, { connection: redisConnection });

  qEvents.on('completed', ({ jobId }) => {
    logger.log(`Job completed: ID=${jobId} Queue=${queueName}`);
  });

  qEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error(`Job failed: ID=${jobId} Queue=${queueName} Reason=${failedReason}`);
  });

  return qEvents;
}

