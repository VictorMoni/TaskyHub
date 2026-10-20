export async function requestTasks<T = unknown>(
  method: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch("/api/tasks", {
    method,
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  if (!response.ok) throw new Error("Task request failed: " + response.status);
  return response.json() as Promise<T>;
}
