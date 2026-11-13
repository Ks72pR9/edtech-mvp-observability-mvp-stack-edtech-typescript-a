import { recordDelivery, scheduleHealthCheck } from "./course_delivery.ts";

const result = await recordDelivery({
  courseId: process.env.COURSE_ID ?? "algebra-101",
  learnerId: process.env.LEARNER_ID ?? "learner-7",
  deadline: process.env.DEADLINE ?? new Date(Date.now() + 86_400_000).toISOString(),
});
const job = await scheduleHealthCheck(process.env.HEALTH_CHECK_URL ?? "https://example.com/health");
console.log(JSON.stringify({ delivery: result, healthCheckJobId: job.job_id }));
