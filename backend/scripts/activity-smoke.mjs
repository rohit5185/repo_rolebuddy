import assert from "node:assert/strict";

import { recordCheckIn, updateLastActive } from "../src/features/activity/activity.service.js";
import { calculateNextStreakCount, isSameDay, isYesterday } from "../src/features/activity/activity.utils.js";
import { User } from "../src/features/auth/auth.model.js";

const realFindById = User.findById;
const realUpdateOne = User.updateOne;

function installUserMocks(doc, updateResult = { modifiedCount: 1 }) {
  const calls = [];

  User.findById = () => ({
    select: () => ({
      lean: async () => doc
    })
  });

  User.updateOne = async (...args) => {
    calls.push(args);
    return updateResult;
  };

  return calls;
}

async function run() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  assert.equal(isSameDay("2026-04-19T01:00:00Z", "2026-04-19T23:59:59Z"), true);
  assert.equal(isYesterday(yesterday.toISOString()), true);

  assert.equal(calculateNextStreakCount({ streakCount: 0, checkInHistory: [] }, "done", new Date("2026-04-19T10:00:00Z")), 1);
  assert.equal(
    calculateNextStreakCount(
      {
        streakCount: 4,
        checkInHistory: [{ date: new Date("2026-04-18T09:00:00Z"), status: "done" }]
      },
      "done",
      new Date("2026-04-19T10:00:00Z")
    ),
    5
  );
  assert.equal(
    calculateNextStreakCount(
      {
        streakCount: 4,
        checkInHistory: [{ date: new Date("2026-04-17T09:00:00Z"), status: "done" }]
      },
      "done",
      new Date("2026-04-19T10:00:00Z")
    ),
    1
  );
  assert.equal(
    calculateNextStreakCount(
      {
        streakCount: 9,
        checkInHistory: [{ date: new Date("2026-04-18T09:00:00Z"), status: "done" }]
      },
      "not_done",
      new Date("2026-04-19T10:00:00Z")
    ),
    0
  );

  let calls = installUserMocks({
    _id: "u1",
    lastCheckInDate: null,
    streakCount: 4,
    checkInHistory: [{ date: new Date("2026-04-18T09:00:00Z"), status: "done" }]
  });

  await recordCheckIn("u1", "done", new Date("2026-04-19T10:00:00Z"));
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1]["$set"].streakCount, 5);
  assert.equal(calls[0][1]["$push"].checkInHistory.status, "done");
  assert.equal(calls[0][1]["$set"].lastCheckInDate.toISOString(), "2026-04-19T10:00:00.000Z");

  installUserMocks({
    _id: "u1",
    lastCheckInDate: new Date("2026-04-19T08:00:00Z"),
    streakCount: 5,
    checkInHistory: [{ date: new Date("2026-04-19T08:00:00Z"), status: "done" }]
  });

  await assert.rejects(() => recordCheckIn("u1", "done", new Date("2026-04-19T10:00:00Z")), {
    message: "You have already checked in today."
  });

  calls = installUserMocks({
    _id: "u1",
    lastCheckInDate: null,
    streakCount: 0,
    checkInHistory: []
  });

  await updateLastActive("u1", new Date("2026-04-19T10:00:00Z"));
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1]["$set"].lastActiveAt.toISOString(), "2026-04-19T10:00:00.000Z");

  console.log("activity checks passed");
}

try {
  await run();
} finally {
  User.findById = realFindById;
  User.updateOne = realUpdateOne;
}
