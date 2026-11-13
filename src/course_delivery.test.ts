import test from "node:test";
import assert from "node:assert/strict";
import { deliveryState, deliveryRequest } from "./course_delivery.ts";

test("an unfinished deadline becomes late after the deadline", () => {
  const request = deliveryRequest.parse({
    courseId: "algebra-101",
    learnerId: "learner-7",
    deadline: "2026-10-20T09:00:00Z",
  });
  assert.equal(deliveryState(request, new Date("2026-10-20T09:01:00Z")), "late");
});
