import { test, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import { requestTasks } from "../src/lib/tasks-api.ts";
afterEach(() => mock.restoreAll());
test("GET returns data without sending a body", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () =>
    Response.json([]),
  );
  assert.deepEqual(await requestTasks("GET"), []);
  assert.deepEqual(fetchMock.mock.calls[0].arguments, [
    "/api/tasks",
    { method: "GET" },
  ]);
});
test("mutations serialize JSON and return the response", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () =>
    Response.json({ _id: "1" }),
  );
  assert.deepEqual(await requestTasks("POST", { title: "Example" }), {
    _id: "1",
  });
  assert.deepEqual(fetchMock.mock.calls[0].arguments[1], {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"title":"Example"}',
  });
});
test("HTTP and network failures reject instead of reporting success", async () => {
  mock.method(
    globalThis,
    "fetch",
    async () => new Response("failure", { status: 500 }),
  );
  await assert.rejects(requestTasks("DELETE", { _id: "1" }), /500/);
  mock.restoreAll();
  mock.method(globalThis, "fetch", async () => {
    throw new Error("offline");
  });
  await assert.rejects(requestTasks("GET"), /offline/);
});
