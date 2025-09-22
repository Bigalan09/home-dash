import { file } from "bun";

// Load environment variables
const env = {
  TODOIST_API_KEY: process.env.TODOIST_API_KEY || "",
  TODOIST_BASE_URL:
    process.env.TODOIST_BASE_URL || "https://api.todoist.com/rest/v2",
  TODOIST_CALENDAR_URL: process.env.TODOIST_CALENDAR_URL || "",
  APPLE_CALENDAR_URL: process.env.APPLE_CALENDAR_URL || "",
  UK_HOLIDAYS_CALENDAR_URL:
    process.env.UK_HOLIDAYS_CALENDAR_URL ||
    "https://www.gov.uk/bank-holidays/england-and-wales.ics",
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || "",
  WEATHER_LAT: process.env.WEATHER_LAT || "51.5074",
  WEATHER_LON: process.env.WEATHER_LON || "-0.1278",
  WEATHER_UNITS: process.env.WEATHER_UNITS || "metric",
  WEATHER_EXCLUDE: process.env.WEATHER_EXCLUDE || "minutely",
  TIME_API_URL:
    process.env.TIME_API_URL ||
    "http://worldtimeapi.org/api/timezone/Europe/London",
  PORT: process.env.PORT || 3000,
};

// Weather cache to limit API calls (30-minute cache)
interface WeatherCache {
  data: any;
  timestamp: number;
}

let weatherCache: WeatherCache | null = null;
const WEATHER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Completed events tracking (in-memory storage for demo - use database in production)
const completedEvents = new Set<string>();
const dismissedEvents = new Set<string>();

// Task completion handler
async function handleTaskCompletion(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (
    !env.TODOIST_API_KEY ||
    env.TODOIST_API_KEY === "your_todoist_api_key_here"
  ) {
    return new Response(
      JSON.stringify({ error: "Todoist API key not configured" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const body = await req.json();
    const { taskId } = body;

    if (!taskId) {
      return new Response(JSON.stringify({ error: "Task ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Completing Todoist task: ${taskId}`);

    // Complete task in Todoist
    const response = await fetch(
      `${env.TODOIST_BASE_URL}/tasks/${taskId}/close`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.TODOIST_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Todoist API Error: ${errorData.error || response.statusText}`,
      );
    }

    console.log(`Task ${taskId} completed successfully`);

    return new Response(JSON.stringify({ success: true, taskId }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Task completion error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to complete task",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Event management handler
async function handleEventAction(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { eventId, action, source } = body;

    if (!eventId || !action) {
      return new Response(
        JSON.stringify({ error: "Event ID and action required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    console.log(`${action} event: ${eventId} from ${source}`);

    if (action === "complete") {
      completedEvents.add(eventId);
    } else if (action === "dismiss") {
      dismissedEvents.add(eventId);
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        eventId,
        action,
        message: `Event ${action}d successfully`,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("Event action error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process event action",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// API proxy handlers
async function handleTodoistTasks(req: Request): Promise<Response> {
  if (
    !env.TODOIST_API_KEY ||
    env.TODOIST_API_KEY === "your_todoist_api_key_here"
  ) {
    return new Response(
      JSON.stringify({
        error: "Todoist API key not configured",
        tasks: [],
        message: "Configure TODOIST_API_KEY in .env file",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const response = await fetch(`${env.TODOIST_BASE_URL}/tasks`, {
      headers: {
        Authorization: `Bearer ${env.TODOIST_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Weather API Error: ${data.message || response.statusText}`,
      );
    }

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Todoist API error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch tasks" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleAppleCalendar(req: Request): Promise<Response> {
  try {
    const allEvents: any[] = [];

    // Define calendar sources
    const calendarSources = [
      { name: "Todoist", url: env.TODOIST_CALENDAR_URL, required: false },
      { name: "Apple Calendar", url: env.APPLE_CALENDAR_URL, required: false },
      {
        name: "UK Holidays",
        url: env.UK_HOLIDAYS_CALENDAR_URL,
        required: false,
      },
    ];

    for (const source of calendarSources) {
      if (
        !source.url ||
        source.url.includes("your_") ||
        source.url.includes("_here")
      ) {
        console.log(`Skipping ${source.name}: URL not configured`);
        continue;
      }

      try {
        // Convert webcal:// to https://
        const calendarUrl = source.url.replace("webcal://", "https://");

        console.log(`Fetching ${source.name} calendar from: ${calendarUrl}`);
        const response = await fetch(calendarUrl);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const icsData = await response.text();
        const events = parseICSData(icsData, source.name);

        allEvents.push(...events);
        console.log(
          `Successfully loaded ${events.length} events from ${source.name}`,
        );
      } catch (error) {
        console.error(`Error fetching ${source.name} calendar:`, error);
        // Continue with other calendars even if one fails
      }
    }

    // Filter out completed and dismissed events
    const filteredEvents = allEvents.filter((event) => {
      return !completedEvents.has(event.id) && !dismissedEvents.has(event.id);
    });

    // Sort events by date
    filteredEvents.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return new Response(
      JSON.stringify({
        events: filteredEvents,
        total_events: allEvents.length,
        filtered_events: filteredEvents.length,
        completed_count: completedEvents.size,
        dismissed_count: dismissedEvents.size,
        sources: calendarSources.map((s) => ({
          name: s.name,
          configured: !(
            !s.url ||
            s.url.includes("your_") ||
            s.url.includes("_here")
          ),
        })),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("Calendar error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch calendars",
        events: [],
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

async function handleWeather(req: Request): Promise<Response> {
  if (
    !env.OPENWEATHER_API_KEY ||
    env.OPENWEATHER_API_KEY === "your_openweather_api_key_here"
  ) {
    return new Response(
      JSON.stringify({
        error: "Weather API key not configured",
        weather: {},
        message: "Configure OPENWEATHER_API_KEY in .env file",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Check cache first
  const now = Date.now();
  if (weatherCache && now - weatherCache.timestamp < WEATHER_CACHE_DURATION) {
    console.log("Serving weather data from cache");
    return new Response(
      JSON.stringify({
        ...weatherCache.data,
        cached: true,
        cache_age_minutes: Math.round((now - weatherCache.timestamp) / 60000),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }

  try {
    console.log("Attempting to fetch weather data from OpenWeather API 3.0");
    let response = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${env.WEATHER_LAT}&lon=${env.WEATHER_LON}&exclude=${env.WEATHER_EXCLUDE}&appid=${env.OPENWEATHER_API_KEY}&units=${env.WEATHER_UNITS}`,
    );

    let data = await response.json();

    // If One Call 3.0 fails due to subscription, fallback to standard API
    if (
      !response.ok &&
      data.message &&
      (data.message.includes("One Call 3.0") ||
        data.message.includes("One Call by Call"))
    ) {
      console.log(
        "One Call 3.0 not available, falling back to standard weather API",
      );
      response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${env.WEATHER_LAT}&lon=${env.WEATHER_LON}&appid=${env.OPENWEATHER_API_KEY}&units=${env.WEATHER_UNITS}`,
      );
      data = await response.json();
    }

    if (!response.ok) {
      throw new Error(
        `Weather API Error: ${data.message || response.statusText}`,
      );
    }

    // Cache the successful response
    weatherCache = {
      data: data,
      timestamp: now,
    };

    console.log("Weather data fetched successfully");
    return new Response(
      JSON.stringify({
        ...data,
        cached: false,
        fetch_time: new Date().toISOString(),
        api_version: data.current ? "3.0" : "2.5",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("Weather API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch weather",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

async function handleTime(req: Request): Promise<Response> {
  // Try different time API endpoints with retry logic
  const timeEndpoints = [
    "https://worldtimeapi.org/api/timezone/Europe/London",
    env.TIME_API_URL,
  ];

  for (let i = 0; i < timeEndpoints.length; i++) {
    try {
      console.log(
        `Trying time API endpoint ${i + 1}/${timeEndpoints.length}: ${timeEndpoints[i]}`,
      );
      const response = await fetch(timeEndpoints[i], {
        signal: AbortSignal.timeout(8000), // 8 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Time API request successful");
      return new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      console.error(`Time API endpoint ${i + 1} failed:`, error.message);
      if (i === timeEndpoints.length - 1) {
        // Last endpoint failed, return fallback
        break;
      }
    }
  }

  // All endpoints failed, return local time as fallback
  console.log("All time API endpoints failed, using local time");
  const now = new Date();
  const fallbackData = {
    datetime: now.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    utc_offset: now.getTimezoneOffset() * -60,
    fallback: true,
    error: "Using local time due to API unavailability",
  };
  return new Response(JSON.stringify(fallbackData), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// Basic ICS parser (simplified)
function parseICSData(icsData: string, sourceName: string = "Unknown"): any[] {
  const events: any[] = [];
  const lines = icsData.split("\n");
  let currentEvent: any = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine === "BEGIN:VEVENT") {
      currentEvent = {};
    } else if (trimmedLine === "END:VEVENT" && currentEvent) {
      if (currentEvent.summary && currentEvent.dtstart) {
        events.push({
          id: currentEvent.uid || Date.now().toString(),
          title: currentEvent.summary,
          date: formatICSDate(currentEvent.dtstart),
          time: formatICSTime(currentEvent.dtstart),
          duration: calculateDuration(currentEvent.dtstart, currentEvent.dtend),
          description: currentEvent.description || "",
          location: currentEvent.location || "",
          priority: "medium",
          source: sourceName,
        });
      }
      currentEvent = null;
    } else if (currentEvent && trimmedLine.includes(":")) {
      const [key, ...valueParts] = trimmedLine.split(":");
      const value = valueParts.join(":");

      switch (key) {
        case "SUMMARY":
          currentEvent.summary = value;
          break;
        case "DTSTART":
        case "DTSTART;VALUE=DATE":
          currentEvent.dtstart = value;
          break;
        case "DTEND":
        case "DTEND;VALUE=DATE":
          currentEvent.dtend = value;
          break;
        case "DESCRIPTION":
          currentEvent.description = value;
          break;
        case "LOCATION":
          currentEvent.location = value;
          break;
        case "UID":
          currentEvent.uid = value;
          break;
      }
    }
  }

  return events;
}

function formatICSDate(icsDate: string): string {
  if (!icsDate) return new Date().toISOString().split("T")[0];

  // Handle different ICS date formats
  if (icsDate.length === 8) {
    // YYYYMMDD format
    const year = icsDate.substring(0, 4);
    const month = icsDate.substring(4, 6);
    const day = icsDate.substring(6, 8);
    return `${year}-${month}-${day}`;
  } else if (icsDate.includes("T")) {
    // YYYYMMDDTHHMMSS format
    const datePart = icsDate.split("T")[0];
    const year = datePart.substring(0, 4);
    const month = datePart.substring(4, 6);
    const day = datePart.substring(6, 8);
    return `${year}-${month}-${day}`;
  }

  return new Date().toISOString().split("T")[0];
}

function formatICSTime(icsDate: string): string {
  if (!icsDate || !icsDate.includes("T")) return "00:00";

  const timePart = icsDate.split("T")[1];
  if (timePart && timePart.length >= 4) {
    const hours = timePart.substring(0, 2);
    const minutes = timePart.substring(2, 4);
    return `${hours}:${minutes}`;
  }

  return "00:00";
}

function calculateDuration(start: string, end: string): string {
  if (!start || !end) return "1 hour";

  try {
    const startTime = new Date(
      start.replace(
        /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/,
        "$1-$2-$3T$4:$5:$6",
      ),
    );
    const endTime = new Date(
      end.replace(
        /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/,
        "$1-$2-$3T$4:$5:$6",
      ),
    );

    const diffMs = endTime.getTime() - startTime.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    return diffHours > 0
      ? `${diffHours} hour${diffHours !== 1 ? "s" : ""}`
      : "1 hour";
  } catch {
    return "1 hour";
  }
}

const server = Bun.serve({
  port: Number(env.PORT),
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
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // API endpoints
    if (url.pathname === "/api/tasks") {
      return handleTodoistTasks(req);
    }

    if (url.pathname === "/api/tasks/complete") {
      return handleTaskCompletion(req);
    }

    if (url.pathname === "/api/events/action") {
      return handleEventAction(req);
    }

    if (url.pathname === "/api/calendar") {
      return handleAppleCalendar(req);
    }

    if (url.pathname === "/api/weather") {
      return handleWeather(req);
    }

    if (url.pathname === "/api/time") {
      return handleTime(req);
    }

    // Serve index.html for root path
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(file("./index.html"));
    }

    // Serve static files
    const filePath = `.${url.pathname}`;
    const fileExists = Bun.file(filePath).exists();

    if (fileExists) {
      return new Response(file(filePath));
    }

    // 404 for missing files
    return new Response("Not Found", { status: 404 });
  },
  development: {
    hmr: true,
  },
});

console.log(
  `🚀 Mission Control Dashboard running at http://localhost:${server.port}`,
);
console.log(`📡 API endpoints available:`);
console.log(`   - /api/tasks (Todoist)`);
console.log(`   - /api/calendar (Apple Calendar)`);
console.log(`   - /api/weather (OpenWeather)`);
console.log(`   - /api/time (World Time API)`);
