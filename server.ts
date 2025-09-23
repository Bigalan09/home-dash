// server.ts

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

// Weather cache to limit API calls (30 minute cache)
interface WeatherCache {
  data: any;
  timestamp: number;
}

let weatherCache: WeatherCache | null = null;
let forecastCache: WeatherCache | null = null;
const WEATHER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Completed events tracking (in memory storage for demo - use database in production)
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
  } catch (error: any) {
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
  } catch (error: any) {
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
async function handleTodoistTasks(_req: Request): Promise<Response> {
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

async function handleAppleCalendar(_req: Request): Promise<Response> {
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
  } catch (error: any) {
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

async function handleWeather(_req: Request): Promise<Response> {
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
  } catch (error: any) {
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

async function handleWeatherForecast(_req: Request): Promise<Response> {
  if (
    !env.OPENWEATHER_API_KEY ||
    env.OPENWEATHER_API_KEY === "your_openweather_api_key_here"
  ) {
    return new Response(
      JSON.stringify({
        error: "Weather API key not configured",
        forecast: {},
        message: "Configure OPENWEATHER_API_KEY in .env file",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Check forecast cache first
  const now = Date.now();
  if (forecastCache && now - forecastCache.timestamp < WEATHER_CACHE_DURATION) {
    console.log("Serving forecast data from cache");
    return new Response(
      JSON.stringify({
        ...forecastCache.data,
        cached: true,
        cache_age_minutes: Math.round((now - forecastCache.timestamp) / 60000),
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
    console.log("Fetching weather forecast from OpenWeather API");

    // Try One Call 3.0 first for full forecast data
    let response = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${env.WEATHER_LAT}&lon=${env.WEATHER_LON}&exclude=minutely,alerts&appid=${env.OPENWEATHER_API_KEY}&units=${env.WEATHER_UNITS}`,
    );

    let data = await response.json();

    // If One Call 3.0 fails, try One Call 2.5
    if (
      !response.ok &&
      data.message &&
      (data.message.includes("One Call 3.0") ||
        data.message.includes("subscription"))
    ) {
      console.log("Falling back to One Call 2.5 API");
      response = await fetch(
        `https://api.openweathermap.org/data/2.5/onecall?lat=${env.WEATHER_LAT}&lon=${env.WEATHER_LON}&exclude=minutely,alerts&appid=${env.OPENWEATHER_API_KEY}&units=${env.WEATHER_UNITS}`,
      );
      data = await response.json();
    }

    // If both One Call APIs fail, try 5 day forecast API
    if (!response.ok) {
      console.log("Falling back to 5 day forecast API");
      response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${env.WEATHER_LAT}&lon=${env.WEATHER_LON}&appid=${env.OPENWEATHER_API_KEY}&units=${env.WEATHER_UNITS}`,
      );
      const forecastData = await response.json();

      if (response.ok) {
        // Transform 5 day forecast to match One Call format
        data = {
          current: forecastData.list[0],
          hourly: forecastData.list.slice(0, 24), // First 24 hours
          daily: groupForecastByDay(forecastData.list),
          api_version: "2.5-forecast",
        };
      }
    }

    if (!response.ok) {
      throw new Error(
        `Weather forecast API Error: ${data.message || response.statusText}`,
      );
    }

    // Cache the successful response
    forecastCache = {
      data: data,
      timestamp: now,
    };

    console.log("Weather forecast fetched successfully");
    return new Response(
      JSON.stringify({
        ...data,
        cached: false,
        fetch_time: new Date().toISOString(),
        api_version:
          data.api_version ||
          (data.hourly && data.daily ? "one-call" : "standard"),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error: any) {
    console.error("Weather forecast API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch weather forecast",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

async function handleTime(_req: Request): Promise<Response> {
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
    } catch (error: any) {
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
        // Check if this is an all day event
        const isAllDay =
          currentEvent.dtstartType === "DATE" ||
          (!currentEvent.dtstart.includes("T") &&
            currentEvent.dtstart.length === 8);

        events.push({
          id: currentEvent.uid || Date.now().toString(),
          title: currentEvent.summary,
          date: formatICSDate(currentEvent.dtstart),
          time: isAllDay ? "All day" : formatICSTime(currentEvent.dtstart),
          duration: calculateDuration(
            currentEvent.dtstart,
            currentEvent.dtend,
            isAllDay,
          ),
          description: currentEvent.description || "",
          location: currentEvent.location || "",
          priority: "medium",
          source: sourceName,
          isAllDay: isAllDay,
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
          currentEvent.dtstart = value;
          currentEvent.dtstartType = "DATETIME";
          break;
        case "DTSTART;VALUE=DATE":
          currentEvent.dtstart = value;
          currentEvent.dtstartType = "DATE";
          break;
        case "DTEND":
          currentEvent.dtend = value;
          currentEvent.dtendType = "DATETIME";
          break;
        case "DTEND;VALUE=DATE":
          currentEvent.dtend = value;
          currentEvent.dtendType = "DATE";
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

// Helper function to group 5 day forecast by day
function groupForecastByDay(forecastList: any[]): any[] {
  const dailyData: { [key: string]: any[] } = {};

  forecastList.forEach((item) => {
    const date = new Date(item.dt * 1000).toISOString().split("T")[0];
    if (!dailyData[date]) {
      dailyData[date] = [];
    }
    dailyData[date].push(item);
  });

  return Object.entries(dailyData)
    .slice(0, 5)
    .map(([date, items]) => {
      // Get mid day item for daily summary or first item if no mid day available
      const midDayItem =
        items.find((item) => {
          const hour = new Date(item.dt * 1000).getHours();
          return hour >= 11 && hour <= 15;
        }) || items[0];

      return {
        dt: midDayItem.dt,
        temp: {
          day: midDayItem.main.temp,
          min: Math.min(...items.map((i) => i.main.temp_min)),
          max: Math.max(...items.map((i) => i.main.temp_max)),
        },
        weather: midDayItem.weather,
        humidity: midDayItem.main.humidity,
        wind_speed: midDayItem.wind?.speed || 0,
      };
    });
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
  if (!icsDate) return "00:00";

  // Handle UTC timezone indicator
  let cleanDate = icsDate.replace("Z", "");

  // If no time component, return default
  if (!cleanDate.includes("T")) return "00:00";

  const timePart = cleanDate.split("T")[1];
  if (timePart && timePart.length >= 4) {
    const hours = timePart.substring(0, 2);
    const minutes = timePart.substring(2, 4);

    // Return 24 hour format for consistency with dashboard theme
    return `${hours}:${minutes}`;
  }

  return "00:00";
}

function calculateDuration(
  start: string,
  end: string,
  isAllDay: boolean = false,
): string {
  if (!start) return isAllDay ? "All day" : "1 hour";
  if (!end) return isAllDay ? "All day" : "1 hour";

  if (isAllDay) return "All day";

  try {
    // Handle both date only and datetime formats
    let startTime: Date;
    let endTime: Date;

    if (start.includes("T")) {
      // DateTime format: YYYYMMDDTHHMMSS
      startTime = new Date(
        start.replace(
          /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/,
          "$1-$2-$3T$4:$5:$6",
        ),
      );
    } else {
      // Date only format: YYYYMMDD
      startTime = new Date(start.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"));
    }

    if (end.includes("T")) {
      // DateTime format: YYYYMMDDTHHMMSS
      endTime = new Date(
        end.replace(
          /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/,
          "$1-$2-$3T$4:$5:$6",
        ),
      );
    } else {
      // Date only format: YYYYMMDD
      endTime = new Date(end.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"));
    }

    const diffMs = endTime.getTime() - startTime.getTime();

    if (diffMs <= 0) return "1 hour";

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
    }

    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.round(diffMs / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`;
    }

    return "1 hour";
  } catch (error) {
    console.error("Error calculating duration:", error);
    return isAllDay ? "All day" : "1 hour";
  }
}

// Simple content type map for static files
const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

const server = Bun.serve({
  port: Number(env.PORT),
  async fetch(req) {
    const url = new URL(req.url);

    // Normalise path to be tolerant of trailing slashes
    const path = url.pathname.replace(/\/+$/, "") || "/";

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
    if (path === "/api/tasks") {
      return handleTodoistTasks(req);
    }

    if (path === "/api/tasks/complete") {
      return handleTaskCompletion(req);
    }

    if (path === "/api/events/action") {
      return handleEventAction(req);
    }

    if (path === "/api/calendar") {
      return handleAppleCalendar(req);
    }

    if (path === "/api/weather") {
      return handleWeather(req);
    }

    if (path === "/api/weather/forecast") {
      return handleWeatherForecast(req);
    }

    if (path === "/api/time") {
      return handleTime(req);
    }

    // Serve index.html for root path
    if (path === "/" || path === "/index.html") {
      return new Response(file("./index.html"), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Serve static files
    const filePath = `.${url.pathname}`;
    const blob = Bun.file(filePath);

    if (await blob.exists()) {
      const ext =
        filePath.lastIndexOf(".") >= 0
          ? filePath.substring(filePath.lastIndexOf("."))
          : "";
      const type = contentTypes[ext] || "application/octet-stream";
      return new Response(blob, { headers: { "Content-Type": type } });
    }

    // Optional SPA fallback: uncomment to route unknown paths to index.html
    // return new Response(file("./index.html"), {
    //   status: 200,
    //   headers: { "Content-Type": "text/html; charset=utf-8" },
    // });

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
console.log(`   - /api/weather/forecast (OpenWeather Forecast)`);
console.log(`   - /api/time (World Time API)`);
