import { z } from "zod";
import { infrai } from "./infra_client.ts";

export const deliveryRequest = z.object({
  courseId: z.string().min(1),
  learnerId: z.string().min(1),
  deadline: z.coerce.date(),
  completedAt: z.coerce.date().optional(),
});

export type DeliveryRequest = z.infer<typeof deliveryRequest>;

export function deliveryState(input: DeliveryRequest, now: Date): "completed" | "late" | "due" {
  if (input.completedAt) return input.completedAt <= input.deadline ? "completed" : "late";
  return now > input.deadline ? "late" : "due";
}

export async function recordDelivery(input: unknown, now = new Date()) {
  const request = deliveryRequest.parse(input);
  const state = deliveryState(request, now);
  const tags = { course_id: request.courseId, state };
  await infrai.metrics.report({ type: "counter", name: "course.deadline.checked", value: 1, tags });
  return { courseId: request.courseId, learnerId: request.learnerId, state };
}

export async function scheduleHealthCheck(task: string) {
  return infrai.cron.create({ cron_expr: "0 * * * *", task });
}

export async function captureDeliveryError(error: unknown, input: DeliveryRequest) {
  return infrai.errors.capture({
    message: error instanceof Error ? error.message : String(error),
    level: "error",
    fingerprint: ["course-delivery", input.courseId],
    exception: error instanceof Error ? error.message : String(error),
    context: { courseId: input.courseId, learnerId: input.learnerId },
  });
}
