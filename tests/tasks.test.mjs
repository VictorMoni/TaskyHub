import { test } from "node:test";
import assert from "node:assert/strict";
import {
  selectTasks,
  summarizeTasks,
  toDateTimeInput,
} from "../src/lib/tasks.ts";
const tasks = [
  {
    _id: "1",
    title: "Zulu",
    done: false,
    recurrence: "none",
    dueDate: "2026-10-19T12:00:00Z",
  },
  {
    _id: "2",
    title: "Alpha",
    done: true,
    recurrence: "none",
    dueDate: "2026-10-18T12:00:00Z",
  },
  {
    _id: "3",
    title: "Beta",
    done: false,
    recurrence: "none",
    dueDate: "2026-10-21T12:00:00Z",
  },
];
test("search, status filters and ordering compose without mutating tasks", () => {
  assert.deepEqual(
    selectTasks(tasks, "A", "pending", "asc").map((t) => t.title),
    ["Beta"],
  );
  assert.deepEqual(
    selectTasks(tasks, "", "completed", "asc").map((t) => t.title),
    ["Alpha"],
  );
  assert.deepEqual(
    selectTasks(tasks, "", "all", "desc").map((t) => t.title),
    ["Zulu", "Beta", "Alpha"],
  );
  assert.deepEqual(
    tasks.map((t) => t._id),
    ["1", "2", "3"],
  );
});
test("summary excludes completed and future tasks from overdue counts", () => {
  assert.deepEqual(summarizeTasks(tasks, new Date("2026-10-20T12:00:00Z")), {
    completedCount: 1,
    pendingCount: 2,
    overdueCount: 1,
    progress: 33,
  });
  assert.deepEqual(summarizeTasks([]), {
    completedCount: 0,
    pendingCount: 0,
    overdueCount: 0,
    progress: 0,
  });
});
test("editing preserves the local date and time", () => {
  assert.equal(toDateTimeInput(), "");
  assert.equal(
    toDateTimeInput(new Date(2026, 9, 20, 14, 30).toISOString()),
    "2026-10-20T14:30",
  );
});
