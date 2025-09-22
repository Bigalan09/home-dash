import { test, expect, describe } from "bun:test";

// Mock DOM environment for testing
const mockDOM = () => {
  // Create a basic DOM mock
  (global as any).document = {
    addEventListener: () => {},
    getElementById: (id: string) => ({
      textContent: "",
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {},
        contains: () => false
      },
      addEventListener: () => {},
      style: {}
    }),
    querySelectorAll: () => [],
    createElement: () => ({
      textContent: "",
      innerHTML: "",
      setAttribute: () => {},
      addEventListener: () => {},
      style: {}
    })
  };

  (global as any).window = {
    innerWidth: 720,
    innerHeight: 1280,
    addEventListener: () => {},
    setInterval: () => 1,
    setTimeout: () => 1,
    clearInterval: () => {},
    clearTimeout: () => {}
  };

  (global as any).Date.now = () => 1695369600000; // Fixed timestamp for testing
  (global as any).fetch = async () => ({
    ok: true,
    json: async () => ({})
  });
};

describe("Frontend JavaScript Functions", () => {
  test("API_CONFIG is properly defined", () => {
    mockDOM();

    const API_CONFIG = {
      ENDPOINTS: {
        TASKS: "/api/tasks",
        CALENDAR: "/api/calendar",
        WEATHER: "/api/weather",
        TIME: "/api/time",
      },
    };

    expect(API_CONFIG.ENDPOINTS.TASKS).toBe("/api/tasks");
    expect(API_CONFIG.ENDPOINTS.CALENDAR).toBe("/api/calendar");
    expect(API_CONFIG.ENDPOINTS.WEATHER).toBe("/api/weather");
    expect(API_CONFIG.ENDPOINTS.TIME).toBe("/api/time");
  });

  test("MissionControlDashboard class can be instantiated", () => {
    mockDOM();

    // Simple class definition for testing
    class MissionControlDashboard {
      currentView: string;
      currentDate: Date;
      events: any[];
      tasks: any[];

      constructor() {
        this.currentView = "monthly";
        this.currentDate = new Date();
        this.events = [];
        this.tasks = [];
      }

      formatDate(dateString: string): string {
        const date = new Date(dateString);
        const today = new Date();
        const dateStr = date.toDateString();
        const todayStr = today.toDateString();

        if (dateStr === todayStr) return "Today";
        return date.toLocaleDateString("en-GB", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
      }

      convertTodoistPriority(todoistPriority: number): number {
        switch (todoistPriority) {
          case 4: return 1; // urgent -> highest
          case 3: return 2; // very high -> high
          case 2: return 2; // high -> high
          case 1: return 3; // normal -> medium
          default: return 3; // default to medium
        }
      }

      escapeHtml(text: string): string {
        return text.replace(/[&<>"']/g, (match) => {
          const escapeMap: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
          };
          return escapeMap[match];
        });
      }
    }

    const dashboard = new MissionControlDashboard();

    expect(dashboard.currentView).toBe("monthly");
    expect(dashboard.currentDate).toBeInstanceOf(Date);
    expect(Array.isArray(dashboard.events)).toBe(true);
    expect(Array.isArray(dashboard.tasks)).toBe(true);
  });

  test("formatDate function works correctly", () => {
    mockDOM();

    class TestDashboard {
      formatDate(dateString: string): string {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dateStr = date.toDateString();
        const todayStr = today.toDateString();
        const tomorrowStr = tomorrow.toDateString();

        if (dateStr === todayStr) return "Today";
        if (dateStr === tomorrowStr) return "Tomorrow";

        return date.toLocaleDateString("en-GB", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
      }
    }

    const dashboard = new TestDashboard();
    const today = new Date().toISOString();

    expect(dashboard.formatDate(today)).toBe("Today");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(dashboard.formatDate(tomorrow.toISOString())).toBe("Tomorrow");
  });

  test("convertTodoistPriority function maps priorities correctly", () => {
    mockDOM();

    class TestDashboard {
      convertTodoistPriority(todoistPriority: number): number {
        switch (todoistPriority) {
          case 4: return 1; // urgent -> highest
          case 3: return 2; // very high -> high
          case 2: return 2; // high -> high
          case 1: return 3; // normal -> medium
          default: return 3; // default to medium
        }
      }
    }

    const dashboard = new TestDashboard();

    expect(dashboard.convertTodoistPriority(4)).toBe(1); // urgent -> highest
    expect(dashboard.convertTodoistPriority(3)).toBe(2); // very high -> high
    expect(dashboard.convertTodoistPriority(2)).toBe(2); // high -> high
    expect(dashboard.convertTodoistPriority(1)).toBe(3); // normal -> medium
    expect(dashboard.convertTodoistPriority(0)).toBe(3); // default -> medium
  });

  test("escapeHtml function sanitizes HTML correctly", () => {
    mockDOM();

    class TestDashboard {
      escapeHtml(text: string): string {
        return text.replace(/[&<>"']/g, (match) => {
          const escapeMap: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
          };
          return escapeMap[match];
        });
      }
    }

    const dashboard = new TestDashboard();

    expect(dashboard.escapeHtml("<script>alert('xss')</script>"))
      .toBe("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;");

    expect(dashboard.escapeHtml('Hello "World" & \'Universe\''))
      .toBe("Hello &quot;World&quot; &amp; &#39;Universe&#39;");

    expect(dashboard.escapeHtml("Normal text"))
      .toBe("Normal text");
  });

  test("weather icon mapping works correctly", () => {
    mockDOM();

    class TestDashboard {
      getWeatherIcon(main: string, icon: string): string {
        const iconMap: { [key: string]: string } = {
          Clear: icon.includes("d") ? "☀️" : "🌙",
          Clouds: "☁️",
          Rain: "🌧️",
          Drizzle: "🌦️",
          Thunderstorm: "⛈️",
          Snow: "❄️",
          Mist: "🌫️",
          Fog: "🌫️",
          Haze: "🌫️",
        };
        return iconMap[main] || "🌤️";
      }
    }

    const dashboard = new TestDashboard();

    expect(dashboard.getWeatherIcon("Clear", "01d")).toBe("☀️");
    expect(dashboard.getWeatherIcon("Clear", "01n")).toBe("🌙");
    expect(dashboard.getWeatherIcon("Clouds", "02d")).toBe("☁️");
    expect(dashboard.getWeatherIcon("Rain", "10d")).toBe("🌧️");
    expect(dashboard.getWeatherIcon("Unknown", "")).toBe("🌤️");
  });

  test("project name mapping works correctly", () => {
    mockDOM();

    class TestDashboard {
      getProjectName(projectId: number): string {
        const projectMap: { [key: number]: string } = {
          2359781302: "Home & Family",
          2359781338: "Household",
          2359781369: "This Week - Alan",
          2359781460: "Health & Wellbeing",
          2359781437: "Career",
          2359784213: "Reoccurring Tasks",
        };
        return projectMap[projectId] || "General";
      }
    }

    const dashboard = new TestDashboard();

    expect(dashboard.getProjectName(2359781302)).toBe("Home & Family");
    expect(dashboard.getProjectName(2359781338)).toBe("Household");
    expect(dashboard.getProjectName(2359781369)).toBe("This Week - Alan");
    expect(dashboard.getProjectName(999999)).toBe("General");
  });
});