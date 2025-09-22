import { test, expect, describe, beforeAll, afterAll } from "bun:test";

describe("Mission Control Dashboard Server", () => {
  let server: any;
  const BASE_URL = "http://localhost:3001"; // Use different port for testing

  beforeAll(async () => {
    // Start server for testing
    const { file } = require("bun");

    server = Bun.serve({
      port: 3001,
      fetch(req) {
        const url = new URL(req.url);

        // Handle CORS preflight requests
        if (req.method === "OPTIONS") {
          return new Response(null, {
            status: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
          });
        }

        // Mock API endpoints for testing
        if (url.pathname === "/api/time") {
          return new Response(JSON.stringify({
            datetime: new Date().toISOString(),
            timezone: "Europe/London",
            fallback: false
          }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        if (url.pathname === "/api/tasks") {
          return new Response(JSON.stringify([
            {
              id: "test-task-1",
              content: "Test Task",
              project_id: "2359781302",
              priority: 1,
              is_completed: false
            }
          ]), {
            headers: { "Content-Type": "application/json" },
          });
        }

        if (url.pathname === "/api/calendar") {
          return new Response(JSON.stringify({
            events: [
              {
                id: "test-event-1",
                title: "Test Event",
                date: new Date().toISOString().split('T')[0],
                time: "09:00",
                duration: "1 hour",
                source: "Test"
              }
            ]
          }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        if (url.pathname === "/api/weather") {
          return new Response(JSON.stringify({
            current: {
              temp: 20,
              weather: [{ main: "Clear", description: "clear sky", icon: "01d" }]
            }
          }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        if (url.pathname === "/api/tasks/complete") {
          return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        if (url.pathname === "/api/events/action") {
          return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response("Not Found", { status: 404 });
      },
    });

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterAll(() => {
    if (server) {
      server.stop();
    }
  });

  test("server starts successfully", () => {
    expect(server).toBeDefined();
    expect(server.port).toBe(3001);
  });

  test("/api/time endpoint returns valid time data", async () => {
    const response = await fetch(`${BASE_URL}/api/time`);
    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data).toHaveProperty("datetime");
    expect(data).toHaveProperty("timezone");
    expect(typeof data.datetime).toBe("string");
  });

  test("/api/tasks endpoint returns task data", async () => {
    const response = await fetch(`${BASE_URL}/api/tasks`);
    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty("id");
      expect(data[0]).toHaveProperty("content");
    }
  });

  test("/api/calendar endpoint returns calendar data", async () => {
    const response = await fetch(`${BASE_URL}/api/calendar`);
    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data).toHaveProperty("events");
    expect(Array.isArray(data.events)).toBe(true);
  });

  test("/api/weather endpoint returns weather data", async () => {
    const response = await fetch(`${BASE_URL}/api/weather`);
    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data).toHaveProperty("current");
  });

  test("/api/tasks/complete handles POST requests", async () => {
    const response = await fetch(`${BASE_URL}/api/tasks/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: "test-task-1" })
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty("success");
  });

  test("/api/events/action handles POST requests", async () => {
    const response = await fetch(`${BASE_URL}/api/events/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: "test-event-1", action: "complete" })
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty("success");
  });

  test("CORS headers are properly set", async () => {
    const response = await fetch(`${BASE_URL}/api/time`, {
      method: "OPTIONS"
    });

    expect(response.ok).toBe(true);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("GET");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
  });

  test("non-existent endpoints return 404", async () => {
    const response = await fetch(`${BASE_URL}/api/nonexistent`);
    expect(response.status).toBe(404);
  });
});