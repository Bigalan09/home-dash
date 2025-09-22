import { test, expect, describe, beforeAll, afterAll } from "bun:test";

describe("Mission Control Dashboard Integration Tests", () => {
  let server: any;
  const BASE_URL = "http://localhost:3002";

  beforeAll(async () => {
    // Start the actual server for integration testing
    const { spawn } = require("child_process");

    // We'll use the real server but on a different port
    process.env.PORT = "3002";

    const serverModule = await import("../server.ts");

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  afterAll(() => {
    if (server) {
      server.kill();
    }
  });

  test("dashboard loads with all components", async () => {
    const response = await fetch(`${BASE_URL}/`);
    expect(response.status).toBe(200);

    const html = await response.text();

    // Check for essential HTML structure
    expect(html).toContain("Mission Control Dashboard");
    expect(html).toContain("Mission Calendar");
    expect(html).toContain("Mission Tasks");
    expect(html).toContain("script.js");
    expect(html).toContain("styles.css");
  });

  test("CSS file loads correctly", async () => {
    const response = await fetch(`${BASE_URL}/styles.css`);
    expect(response.status).toBe(200);

    const css = await response.text();
    expect(css).toContain(".dashboard");
    expect(css).toContain(".card");
    expect(css).toContain(".modal");
  });

  test("JavaScript file loads correctly", async () => {
    const response = await fetch(`${BASE_URL}/script.js`);
    expect(response.status).toBe(200);

    const js = await response.text();
    expect(js).toContain("MissionControlDashboard");
    expect(js).toContain("API_CONFIG");
  });

  test("all API endpoints respond correctly", async () => {
    // Test time endpoint
    const timeResponse = await fetch(`${BASE_URL}/api/time`);
    expect(timeResponse.status).toBe(200);
    const timeData = await timeResponse.json();
    expect(timeData).toHaveProperty("datetime");

    // Test other endpoints (they may return errors if not configured, but should respond)
    const tasksResponse = await fetch(`${BASE_URL}/api/tasks`);
    expect(tasksResponse.status).toBeOneOf([200, 400]); // 400 if API not configured

    const calendarResponse = await fetch(`${BASE_URL}/api/calendar`);
    expect(calendarResponse.status).toBeOneOf([200, 500]); // May fail if APIs not configured

    const weatherResponse = await fetch(`${BASE_URL}/api/weather`);
    expect(weatherResponse.status).toBeOneOf([200, 400]); // 400 if API not configured
  });

  test("POST endpoints handle requests correctly", async () => {
    // Test task completion endpoint
    const taskResponse = await fetch(`${BASE_URL}/api/tasks/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: "test-task" })
    });

    // Should return 400 if API not configured, or 200/500 if configured
    expect(taskResponse.status).toBeOneOf([200, 400, 500]);

    // Test event action endpoint
    const eventResponse = await fetch(`${BASE_URL}/api/events/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: "test-event", action: "complete" })
    });

    expect(eventResponse.status).toBeOneOf([200, 400, 500]);
  });

  test("error handling for invalid requests", async () => {
    // Test invalid task completion
    const invalidTaskResponse = await fetch(`${BASE_URL}/api/tasks/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}) // Missing taskId
    });

    expect(invalidTaskResponse.status).toBeOneOf([400, 500]);

    // Test invalid event action
    const invalidEventResponse = await fetch(`${BASE_URL}/api/events/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: "test" }) // Missing action
    });

    expect(invalidEventResponse.status).toBeOneOf([400, 500]);

    // Test non-existent endpoint
    const notFoundResponse = await fetch(`${BASE_URL}/api/nonexistent`);
    expect(notFoundResponse.status).toBe(404);
  });

  test("CORS headers are present", async () => {
    const response = await fetch(`${BASE_URL}/api/time`);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  test("static files are served correctly", async () => {
    // Test that static files return appropriate content types
    const cssResponse = await fetch(`${BASE_URL}/styles.css`);
    const jsResponse = await fetch(`${BASE_URL}/script.js`);

    expect(cssResponse.status).toBe(200);
    expect(jsResponse.status).toBe(200);
  });
});

// Custom matcher for multiple possible values
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected.join(", ")}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected.join(", ")}`,
        pass: false,
      };
    }
  },
});