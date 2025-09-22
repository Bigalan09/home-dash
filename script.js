// API Configuration - Using server proxy endpoints
const API_CONFIG = {
  // Server proxy endpoints (configured via .env)
  ENDPOINTS: {
    TASKS: "/api/tasks",
    CALENDAR: "/api/calendar",
    WEATHER: "/api/weather",
    WEATHER_FORECAST: "/api/weather/forecast",
    TIME: "/api/time",
  },
};

// Fallback data for when APIs are not configured
const FALLBACK_MESSAGE =
  "API not configured - check CLAUDE.md for setup instructions";

class MissionControlDashboard {
  constructor() {
    this.currentView = "monthly"; // Default to monthly view for 7" portrait
    this.currentDate = new Date();
    this.currentWeekStart = new Date();
    this.events = [];
    this.tasks = [];
    this.weatherForecast = null;
    this.currentWeatherView = "hourly";
    this.lastActivity = Date.now();
    this.serverTimeOffset = 0; // Time offset from server

    this.initializeDateTime();
    this.loadAllData();
    this.setupEventListeners();
    this.startRefreshTimer();
    this.setupActivityTracking();
  }

  async loadAllData() {
    await Promise.all([
      this.loadEvents(),
      this.loadTasks(),
      this.loadWeather(),
      this.loadWeatherForecast(),
    ]);
    this.initializeCalendarViews();
  }

  // API Methods - Real API integrations via server proxy
  async loadEvents() {
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.CALENDAR);

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.status}`);
      }

      const response_data = await response.json();

      // Check if we got an error response
      if (response_data.error) {
        console.warn("Calendar API not configured:", response_data.error);
        this.events = []; // No events when API not configured
        return;
      }

      // Handle the new response format {events: [...], sources: [...]}
      const events = response_data.events || response_data;

      // Process and validate the events
      this.events = events.map((event) => ({
        ...event,
        attendees: event.attendees || [],
        priority: event.priority || "medium",
      }));

      console.log(
        `Loaded ${this.events.length} calendar events from multiple sources`,
      );
    } catch (error) {
      console.error("Failed to load events:", error);
      this.events = []; // No events when API fails
    }
  }

  async loadTasks() {
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.TASKS);

      if (!response.ok) {
        throw new Error(`Tasks API error: ${response.status}`);
      }

      const tasksData = await response.json();

      // Check if we got an error response
      if (tasksData.error) {
        console.warn("Tasks API not configured:", tasksData.error);
        this.tasks = []; // No tasks when API not configured
        this.renderTasks();
        return;
      }

      // Convert Todoist API format to our format
      this.tasks = tasksData.map((task, index) => ({
        id: task.id || index + 1,
        title: task.content || task.title || "Untitled Task",
        project: this.getProjectName(task.project_id) || "General",
        priority: this.convertTodoistPriority(task.priority),
        due:
          task.due?.date ||
          task.due?.datetime ||
          new Date(Date.now() + 86400000).toISOString(),
        description: task.description || "",
        assignee: task.assignee || "Unassigned",
        status: task.is_completed ? "completed" : "pending",
        completion: task.is_completed ? 100 : 0,
      }));

      this.renderTasks();
    } catch (error) {
      console.error("Failed to load tasks:", error);
      this.tasks = []; // No tasks when API fails
      this.renderTasks();
    }
  }

  // Convert Todoist priority (1-4) to our format
  convertTodoistPriority(todoistPriority) {
    // Todoist: 1=normal, 2=high, 3=very high, 4=urgent
    // Our format: 1=highest, 2=high, 3=medium, 4=low
    switch (todoistPriority) {
      case 4:
        return 1; // urgent -> highest
      case 3:
        return 2; // very high -> high
      case 2:
        return 2; // high -> high
      case 1:
        return 3; // normal -> medium
      default:
        return 3; // default to medium
    }
  }

  // Map Todoist project IDs to readable names
  getProjectName(projectId) {
    const projectMap = {
      2359781302: "Home & Family",
      2359781338: "Household",
      2359781369: "This Week - Alan",
      2359781460: "Health & Wellbeing",
      2359781437: "Career",
      2359784213: "Reoccurring Tasks",
    };
    return projectMap[projectId] || "General";
  }

  async loadWeather() {
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.WEATHER);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();

      // Check if we got an error response
      if (data.error) {
        console.warn("Weather API not configured:", data.error);
        // Fallback to static data
        document.getElementById("temperature").textContent = "18°C";
        document.getElementById("weatherIcon").textContent = "🌤️";
        document.getElementById("weatherDesc").textContent = "Partly Cloudy";
        return;
      }

      // Process OpenWeatherMap One Call API response
      let temp, description, weatherIcon;

      if (data.current) {
        // One Call API format
        temp = Math.round(data.current.temp);
        description = data.current.weather[0].description;
        weatherIcon = this.getWeatherIcon(
          data.current.weather[0].main,
          data.current.weather[0].icon,
        );
      } else if (data.main) {
        // Fallback for standard weather API format
        temp = Math.round(data.main.temp);
        description = data.weather[0].description;
        weatherIcon = this.getWeatherIcon(
          data.weather[0].main,
          data.weather[0].icon,
        );
      } else {
        throw new Error("Unexpected weather data format");
      }

      document.getElementById("temperature").textContent = `${temp}°C`;
      document.getElementById("weatherIcon").textContent = weatherIcon;
      document.getElementById("weatherDesc").textContent =
        description.charAt(0).toUpperCase() + description.slice(1);

      // Log cache status
      if (data.cached) {
        console.log(
          `Weather data served from cache (${data.cache_age_minutes} minutes old)`,
        );
      } else {
        console.log("Fresh weather data fetched from API");
      }
    } catch (error) {
      console.error("Failed to load weather:", error);
      document.getElementById("temperature").textContent = "--°C";
      document.getElementById("weatherIcon").textContent = "❓";
      document.getElementById("weatherDesc").textContent =
        "Weather unavailable";
    }
  }

  // Convert OpenWeatherMap weather codes to emojis
  getWeatherIcon(main, icon) {
    const iconMap = {
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

  async loadWeatherForecast() {
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.WEATHER_FORECAST);

      if (!response.ok) {
        throw new Error(`Weather forecast API error: ${response.status}`);
      }

      const data = await response.json();

      // Check if we got an error response
      if (data.error) {
        console.warn("Weather forecast API not configured:", data.error);
        this.weatherForecast = null;
        return;
      }

      this.weatherForecast = data;
      console.log("Weather forecast loaded successfully");

      // Log cache status
      if (data.cached) {
        console.log(
          `Weather forecast served from cache (${data.cache_age_minutes} minutes old)`,
        );
      } else {
        console.log("Fresh weather forecast fetched from API");
      }
    } catch (error) {
      console.error("Failed to load weather forecast:", error);
      this.weatherForecast = null;
    }
  }

  initializeDateTime() {
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);
    // Sync with time server every 5 minutes
    this.syncTimeWithServer();
    setInterval(() => this.syncTimeWithServer(), 300000);
  }

  async syncTimeWithServer() {
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.TIME);
      if (response.ok) {
        const timeData = await response.json();
        if (timeData.datetime) {
          this.serverTime = new Date(timeData.datetime);
          this.serverTimeOffset = this.serverTime.getTime() - Date.now();
          console.log("Time synced with server");
        }
      }
    } catch (error) {
      console.warn("Failed to sync with time server:", error);
      this.serverTimeOffset = 0; // Fall back to local time
    }
  }

  updateDateTime() {
    // Use server time if available, otherwise fall back to local time
    const now = this.serverTimeOffset
      ? new Date(Date.now() + this.serverTimeOffset)
      : new Date();

    const timeOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };
    const dateOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    document.getElementById("time").textContent = now.toLocaleTimeString(
      "en-GB",
      timeOptions,
    );
    document.getElementById("date").textContent = now.toLocaleDateString(
      "en-GB",
      dateOptions,
    );
  }

  setupEventListeners() {
    // Calendar view switching
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.view;
        this.switchCalendarView(view);
      });
    });

    // Modal close on background click
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("active");
        }
      });
    });
  }

  switchCalendarView(view) {
    this.currentView = view;

    // Update active button
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === view);
    });

    // Update active view
    document.querySelectorAll(".calendar-view").forEach((viewEl) => {
      viewEl.classList.toggle(
        "active",
        viewEl.classList.contains(`calendar-${view}`),
      );
    });

    // Render appropriate view
    if (view === "daily") {
      this.renderDailyView();
    } else if (view === "weekly") {
      this.renderWeeklyView();
    } else if (view === "monthly") {
      this.renderMonthlyView();
    }
  }

  navigateMonth(direction) {
    this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    this.renderMonthlyView();
  }

  navigateWeek(direction) {
    this.currentWeekStart.setDate(
      this.currentWeekStart.getDate() + direction * 7,
    );
    this.renderWeeklyView();
  }

  initializeCalendarViews() {
    this.renderMonthlyView(); // Start with monthly view
    this.renderWeeklyView();
    this.renderDailyView();
  }

  renderDailyView() {
    const today = new Date().toISOString().split("T")[0];
    const todayEvents = this.events.filter((event) => event.date === today);

    const container = document.getElementById("dailyEvents");

    if (todayEvents.length === 0) {
      container.innerHTML =
        '<div class="no-data">No missions scheduled for today</div>';
      return;
    }

    container.innerHTML = todayEvents
      .map(
        (event) => `
            <div class="event" onclick="showEventDetails('${event.id}')">
                <div class="event-title">${this.escapeHtml(event.title)}</div>
                <div class="event-time">${event.time} • ${event.duration}</div>
            </div>
        `,
      )
      .join("");
  }

  renderWeeklyView() {
    const startOfWeek = new Date(this.currentWeekStart);
    // Ensure we start on Monday
    const dayOfWeek = startOfWeek.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(this.currentWeekStart.getDate() - mondayOffset);

    const grid = document.getElementById("weeklyGrid");
    const weekTitle = document.getElementById("weekTitle");

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    weekTitle.textContent = `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${startOfWeek.toLocaleString("en-GB", { month: "short" })} ${startOfWeek.getFullYear()}`;

    let html = "";

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const dayEvents = this.events.filter((event) => event.date === dateStr);
      const isToday = dateStr === new Date().toISOString().split("T")[0];

      html += `
                <div class="calendar-day ${isToday ? "today" : ""}" onclick="showDayEvents('${dateStr}')">
                    <div class="day-number">${date.getDate()}</div>
                    <div class="day-events">
                        ${dayEvents
                          .slice(0, 3)
                          .map(
                            (event) => `
                            <div class="day-event priority-${event.priority}" onclick="event.stopPropagation(); showEventDetails('${event.id}')">
                                ${this.escapeHtml(event.title)}
                            </div>
                        `,
                          )
                          .join("")}
                        ${dayEvents.length > 3 ? `<div class="event-overflow">+${dayEvents.length - 3}</div>` : ""}
                    </div>
                </div>
            `;
    }

    grid.innerHTML = html;
  }

  renderMonthlyView() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);

    // Start on Monday
    const dayOfWeek = firstDay.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - mondayOffset);

    const monthTitle = document.getElementById("monthTitle");
    monthTitle.textContent = `${this.currentDate.toLocaleString("en-GB", { month: "long" })} ${year}`;

    const grid = document.getElementById("monthlyGrid");
    let html = "";

    for (let i = 0; i < 42; i++) {
      // 6 weeks max
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const dayEvents = this.events.filter((event) => event.date === dateStr);
      const isToday = dateStr === new Date().toISOString().split("T")[0];
      const isOtherMonth = date.getMonth() !== month;

      html += `
                <div class="calendar-day ${isToday ? "today" : ""} ${isOtherMonth ? "other-month" : ""}" onclick="showDayEvents('${dateStr}')">
                    <div class="day-number">${date.getDate()}</div>
                    <div class="day-events">
                        ${dayEvents
                          .slice(0, 3)
                          .map(
                            (event) => `
                            <div class="day-event priority-${event.priority}" onclick="event.stopPropagation(); showEventDetails('${event.id}')">
                                ${this.escapeHtml(event.title)}
                            </div>
                        `,
                          )
                          .join("")}
                        ${dayEvents.length > 3 ? `<div class="event-overflow">+${dayEvents.length - 3}</div>` : ""}
                    </div>
                </div>
            `;
    }

    grid.innerHTML = html;
  }

  renderTasks() {
    const container = document.getElementById("todosContainer");

    if (!this.tasks || this.tasks.length === 0) {
      container.innerHTML = '<div class="no-data">No active missions</div>';
      return;
    }

    // Sort by priority and due date
    const sortedTasks = this.tasks
      .filter((task) => task.status !== "completed")
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return new Date(a.due) - new Date(b.due);
      })
      .slice(0, 8);

    container.innerHTML = sortedTasks
      .map(
        (task) => `
            <div class="todo-item priority-${task.priority}" onclick="showTaskDetails('${task.id}')">
                <div class="todo-title">${this.escapeHtml(task.title)}</div>
                <div class="todo-project">${task.project} • Due: ${this.formatDate(task.due)}</div>
            </div>
        `,
      )
      .join("");
  }

  formatDate(dateString) {
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

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  renderWeatherForecast() {
    const container = document.getElementById("weatherForecastContainer");

    if (!this.weatherForecast) {
      container.innerHTML = '<div class="no-data">Weather forecast unavailable</div>';
      return;
    }

    if (this.currentWeatherView === "hourly") {
      this.renderHourlyForecast(container);
    } else {
      this.renderDailyForecast(container);
    }
  }

  renderHourlyForecast(container) {
    const hourlyData = this.weatherForecast.hourly;

    if (!hourlyData || hourlyData.length === 0) {
      container.innerHTML = '<div class="no-data">Hourly forecast not available</div>';
      return;
    }

    // Show next 24 hours
    const next24Hours = hourlyData.slice(0, 24);

    const html = `
      <div class="forecast-grid hourly-grid">
        ${next24Hours.map((hour, index) => {
          const date = new Date(hour.dt * 1000);
          const time = date.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit"
          });
          const temp = Math.round(hour.temp || hour.main?.temp || 0);
          const weatherIcon = this.getWeatherIcon(
            hour.weather[0].main,
            hour.weather[0].icon
          );
          const description = hour.weather[0].description;
          const humidity = hour.humidity || hour.main?.humidity || 0;
          const windSpeed = hour.wind_speed || hour.wind?.speed || 0;

          return `
            <div class="forecast-item ${index === 0 ? 'current' : ''}">
              <div class="forecast-time">${index === 0 ? 'Now' : time}</div>
              <div class="forecast-icon">${weatherIcon}</div>
              <div class="forecast-temp">${temp}°C</div>
              <div class="forecast-desc">${description}</div>
              <div class="forecast-details">
                <div class="detail-item">
                  <i class="ti ti-droplet"></i>
                  <span>${humidity}%</span>
                </div>
                <div class="detail-item">
                  <i class="ti ti-wind"></i>
                  <span>${Math.round(windSpeed)} m/s</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  renderDailyForecast(container) {
    const dailyData = this.weatherForecast.daily;

    if (!dailyData || dailyData.length === 0) {
      container.innerHTML = '<div class="no-data">5-day forecast not available</div>';
      return;
    }

    // Show next 5 days
    const next5Days = dailyData.slice(0, 5);

    const html = `
      <div class="forecast-grid daily-grid">
        ${next5Days.map((day, index) => {
          const date = new Date(day.dt * 1000);
          const dayName = index === 0 ? 'Today' : date.toLocaleDateString("en-GB", {
            weekday: "long"
          });
          const dateStr = date.toLocaleDateString("en-GB", {
            month: "short",
            day: "numeric"
          });

          const tempDay = Math.round(day.temp?.day || day.temp?.max || 0);
          const tempMin = Math.round(day.temp?.min || 0);
          const tempMax = Math.round(day.temp?.max || day.temp?.day || 0);

          const weatherIcon = this.getWeatherIcon(
            day.weather[0].main,
            day.weather[0].icon
          );
          const description = day.weather[0].description;
          const humidity = day.humidity || 0;
          const windSpeed = day.wind_speed || 0;

          return `
            <div class="forecast-item ${index === 0 ? 'current' : ''}">
              <div class="forecast-day">
                <div class="day-name">${dayName}</div>
                <div class="day-date">${dateStr}</div>
              </div>
              <div class="forecast-icon">${weatherIcon}</div>
              <div class="forecast-temps">
                <div class="temp-high">${tempMax}°C</div>
                <div class="temp-low">${tempMin}°C</div>
              </div>
              <div class="forecast-desc">${description}</div>
              <div class="forecast-details">
                <div class="detail-item">
                  <i class="ti ti-droplet"></i>
                  <span>${humidity}%</span>
                </div>
                <div class="detail-item">
                  <i class="ti ti-wind"></i>
                  <span>${Math.round(windSpeed)} m/s</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  showRefreshIndicator() {
    const indicator = document.getElementById("refreshIndicator");
    indicator.classList.add("active");
    setTimeout(() => indicator.classList.remove("active"), 1500);
  }

  startRefreshTimer() {
    setInterval(() => {
      this.showRefreshIndicator();
      // In real implementation, refresh data here
    }, 300000); // 5 minutes
  }

  refreshData() {
    this.showRefreshIndicator();
    // Force refresh all data
    this.loadAllData();
  }

  toggleScreen() {
    // Toggle screen off/on
    const body = document.body;
    if (body.style.display === "none") {
      body.style.display = "block";
    } else {
      body.style.display = "none";
      // Turn back on after 10 seconds for demo purposes
      setTimeout(() => {
        body.style.display = "block";
      }, 10000);
    }
  }

  setupActivityTracking() {
    // Track mouse movement and touch events (optimized for Pi Touch Display 2)
    const trackActivity = () => {
      this.lastActivity = Date.now();
      const pagination = document.getElementById("pagination");
      pagination.classList.add("visible");

      // Hide after 6 seconds
      setTimeout(() => {
        if (Date.now() - this.lastActivity >= 6000) {
          pagination.classList.remove("visible");
        }
      }, 6000);
    };

    // Optimized event listeners for Pi capacitive touch
    document.addEventListener("mousemove", trackActivity);
    document.addEventListener("touchstart", trackActivity, { passive: true });
    document.addEventListener("touchmove", trackActivity, { passive: true });
    document.addEventListener("click", trackActivity);

    // Add touch feedback for better Pi display experience
    this.setupTouchFeedback();
  }

  setupTouchFeedback() {
    // Add visual feedback for touch interactions on Pi display
    const touchElements = document.querySelectorAll(
      ".calendar-day, .event, .todo-item, .system-btn, .view-btn, .month-nav, .weather-section",
    );

    touchElements.forEach((element) => {
      element.addEventListener(
        "touchstart",
        (e) => {
          element.style.transform = "scale(0.95)";
          element.style.transition = "transform 0.1s ease";
        },
        { passive: true },
      );

      element.addEventListener(
        "touchend",
        (e) => {
          setTimeout(() => {
            element.style.transform = "";
          }, 100);
        },
        { passive: true },
      );

      element.addEventListener(
        "touchcancel",
        (e) => {
          element.style.transform = "";
        },
        { passive: true },
      );
    });
  }
}

// Task and Event Action Functions
window.completeTask = async function(taskId, buttonElement) {
  try {
    buttonElement.disabled = true;
    buttonElement.textContent = "Completing...";

    const response = await fetch("/api/tasks/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ taskId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to complete task: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      // Close the modal
      closeModal("taskModal");

      // Refresh the tasks list to remove completed task
      setTimeout(() => {
        dashboard.loadTasks();
      }, 100);

      console.log(`Task ${taskId} completed successfully`);
    } else {
      throw new Error(result.error || "Unknown error");
    }
  } catch (error) {
    console.error("Failed to complete task:", error);
    buttonElement.disabled = false;
    buttonElement.textContent = "Complete Task";

    // Show user-friendly error message
    alert("Failed to complete task. Please try again.");
  }
}

window.handleEventAction = async function(eventId, action, buttonElement) {
  try {
    buttonElement.disabled = true;
    buttonElement.textContent =
      action === "complete" ? "Completing..." : "Dismissing...";

    const response = await fetch("/api/events/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId, action }),
    });

    if (!response.ok) {
      throw new Error(`Failed to ${action} event: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      // Remove the event from the UI with animation
      const eventElement = buttonElement.closest(".day-event");
      if (eventElement) {
        eventElement.style.opacity = "0.5";
        eventElement.style.transform = "scale(0.95)";

        setTimeout(() => {
          // Refresh the calendar to remove completed/dismissed event
          dashboard.loadEvents().then(() => {
            dashboard.initializeCalendarViews();
          });
        }, 300);
      }

      // Close modal if open
      closeModal("eventModal");

      console.log(`Event ${eventId} ${action}d successfully`);
    } else {
      throw new Error(result.error || "Unknown error");
    }
  } catch (error) {
    console.error(`Failed to ${action} event:`, error);
    buttonElement.disabled = false;
    buttonElement.textContent = action === "complete" ? "Complete" : "Dismiss";

    // Show user-friendly error message
    alert(`Failed to ${action} event. Please try again.`);
  }
}

// Global functions for modal interactions
window.showDayEvents = function(dateStr) {
  const dayEvents = dashboard.events.filter((event) => event.date === dateStr);
  if (dayEvents.length === 0) return;

  // For now, show the first event. Could expand to show all events for the day
  window.showEventDetails(dayEvents[0].id);
}

window.showEventDetails = function(eventId) {
  const event = dashboard.events.find((e) => e.id === eventId);
  if (!event) return;

  const modal = document.getElementById("eventModal");
  const body = document.getElementById("eventModalBody");

  body.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Mission:</span>
            <span class="detail-value">${dashboard.escapeHtml(event.title)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Date & Time:</span>
            <span class="detail-value">${dashboard.formatDate(event.date)} at ${event.time}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Duration:</span>
            <span class="detail-value">${event.duration}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Location:</span>
            <span class="detail-value">${event.location}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Priority:</span>
            <span class="detail-value" style="text-transform: uppercase; color: ${event.priority === "high" ? "#ff4757" : event.priority === "medium" ? "#ffa502" : "#00d4ff"}">${event.priority}</span>
        </div>
        <div style="margin-top: 16px;">
            <div class="detail-label">Mission Brief:</div>
            <p style="margin-top: 8px; line-height: 1.5;">${event.description}</p>
        </div>
        <div style="margin-top: 16px;">
            <div class="detail-label">Personnel:</div>
            <ul style="margin-top: 8px; padding-left: 20px;">
                ${event.attendees.map((attendee) => `<li>${attendee}</li>`).join("")}
            </ul>
        </div>
        <div class="event-actions" style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
            <button class="action-btn complete" onclick="handleEventAction('${event.id}', 'complete', this)">Complete</button>
            <button class="action-btn dismiss" onclick="handleEventAction('${event.id}', 'dismiss', this)">Dismiss</button>
        </div>
    `;

  modal.classList.add("active");
}

window.showTaskDetails = function(taskId) {
  const task = dashboard.tasks.find((t) => t.id === taskId);
  if (!task) return;

  const modal = document.getElementById("taskModal");
  const body = document.getElementById("taskModalBody");

  body.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Task:</span>
            <span class="detail-value">${dashboard.escapeHtml(task.title)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Project:</span>
            <span class="detail-value">${task.project}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Priority:</span>
            <span class="detail-value" style="color: ${["#ff4757", "#ffa502", "#00d4ff", "#747d8c"][task.priority - 1]}">P${task.priority}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Due Date:</span>
            <span class="detail-value">${dashboard.formatDate(task.due)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value" style="text-transform: uppercase;">${task.status}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Completion:</span>
            <span class="detail-value">${task.completion}%</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Assigned To:</span>
            <span class="detail-value">${task.assignee}</span>
        </div>
        <div style="margin-top: 16px;">
            <div class="detail-label">Task Description:</div>
            <p style="margin-top: 8px; line-height: 1.5;">${task.description}</p>
        </div>
        <div class="task-actions" style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
            <button class="action-btn complete" onclick="completeTask('${task.id}', this)">Complete Task</button>
        </div>
    `;

  modal.classList.add("active");
}

window.closeModal = function(modalId) {
  document.getElementById(modalId).classList.remove("active");
}

// Weather modal functions
window.showWeatherDetails = function() {
  if (!dashboard.weatherForecast) {
    console.warn("Weather forecast data not available");
    return;
  }

  const modal = document.getElementById("weatherModal");
  modal.classList.add("active");

  // Render the current view
  dashboard.renderWeatherForecast();
}

window.switchWeatherView = function(view) {
  dashboard.currentWeatherView = view;

  // Update active button
  document.querySelectorAll(".weather-view-controls .view-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  // Render the selected view
  dashboard.renderWeatherForecast();
}

// Initialize dashboard
let dashboard;
document.addEventListener("DOMContentLoaded", () => {
  dashboard = new MissionControlDashboard();
});

// Prevent context menu and zoom (optimized for Pi Touch Display 2)
document.addEventListener("contextmenu", (e) => e.preventDefault());

// Improved touch handling for Pi display - prevent double-tap zoom
let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  (e) => {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  },
  false,
);

// Prevent pinch-to-zoom on Pi display
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("gesturechange", (e) => e.preventDefault());
document.addEventListener("gestureend", (e) => e.preventDefault());

// Optimize viewport for Pi Touch Display 2
if (window.innerWidth <= 720 && window.innerHeight <= 1280) {
  // Add Pi-specific optimizations
  const viewport = document.querySelector("meta[name=viewport]");
  if (viewport) {
    viewport.setAttribute(
      "content",
      "width=720, height=1280, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover",
    );
  }
}
