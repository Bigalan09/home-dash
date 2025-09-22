import { test, expect, describe } from "bun:test";
import { readFileSync } from "fs";

describe("Syntax Error Verification Tests", () => {
  test("server.ts has no syntax errors", async () => {
    const serverPath = "/Users/alan/Development/HomeDashboard/server.ts";

    try {
      const serverContent = readFileSync(serverPath, "utf-8");

      // Check for common syntax errors that were fixed
      expect(serverContent).not.toContain("@"); // No stray @ characters
      expect(serverContent).not.toMatch(/\s@\s/); // No @ characters in the middle of lines
      expect(serverContent).not.toMatch(/^@/m); // No @ at start of lines

      // Verify the file can be parsed as valid TypeScript
      // We'll try to import it to ensure no syntax errors
      const module = await import(serverPath);
      expect(module).toBeDefined();

    } catch (error) {
      throw new Error(`server.ts has syntax errors: ${error.message}`);
    }
  });

  test("script.js has no syntax errors", () => {
    const scriptPath = "/Users/alan/Development/HomeDashboard/script.js";

    try {
      const scriptContent = readFileSync(scriptPath, "utf-8");

      // Check for syntax errors
      expect(scriptContent).not.toContain("@"); // No stray @ characters
      expect(scriptContent).not.toMatch(/\s@\s/); // No @ characters in the middle of lines
      expect(scriptContent).not.toMatch(/^@/m); // No @ at start of lines

      // Check for balanced braces and parentheses
      const openBraces = (scriptContent.match(/{/g) || []).length;
      const closeBraces = (scriptContent.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);

      const openParens = (scriptContent.match(/\(/g) || []).length;
      const closeParens = (scriptContent.match(/\)/g) || []).length;
      expect(openParens).toBe(closeParens);

      // Check for common JavaScript syntax patterns
      expect(scriptContent).toContain("class MissionControlDashboard");
      expect(scriptContent).toContain("API_CONFIG");
      expect(scriptContent).toContain("function");

      // Verify no unclosed strings or comments
      expect(scriptContent).not.toMatch(/\/\*(?![\s\S]*\*\/)/); // Unclosed block comments
      expect(scriptContent).not.toMatch(/"[^"]*$/m); // Unclosed double quotes
      expect(scriptContent).not.toMatch(/'[^']*$/m); // Unclosed single quotes

    } catch (error) {
      throw new Error(`script.js has syntax errors: ${error.message}`);
    }
  });

  test("index.html has valid HTML structure", () => {
    const htmlPath = "/Users/alan/Development/HomeDashboard/index.html";

    try {
      const htmlContent = readFileSync(htmlPath, "utf-8");

      // Check for basic HTML structure
      expect(htmlContent).toContain("<!DOCTYPE html>");
      expect(htmlContent).toContain("<html");
      expect(htmlContent).toContain("<head>");
      expect(htmlContent).toContain("</head>");
      expect(htmlContent).toContain("<body>");
      expect(htmlContent).toContain("</body>");
      expect(htmlContent).toContain("</html>");

      // Check for required resources
      expect(htmlContent).toContain('src="script.js"');
      expect(htmlContent).toContain('href="styles.css"');

      // Check for no stray @ characters
      expect(htmlContent).not.toContain("@");

      // Check for balanced tags
      const openDivs = (htmlContent.match(/<div[^>]*>/g) || []).length;
      const closeDivs = (htmlContent.match(/<\/div>/g) || []).length;
      expect(openDivs).toBe(closeDivs);

    } catch (error) {
      throw new Error(`index.html has syntax errors: ${error.message}`);
    }
  });

  test("styles.css has valid CSS syntax", () => {
    const cssPath = "/Users/alan/Development/HomeDashboard/styles.css";

    try {
      const cssContent = readFileSync(cssPath, "utf-8");

      // Check for no stray @ characters (except valid CSS at-rules)
      const strayAtSymbols = cssContent.match(/@(?!import|media|keyframes|font-face|charset|supports|namespace|page|document)/g);
      expect(strayAtSymbols).toBeNull();

      // Check for balanced braces
      const openBraces = (cssContent.match(/{/g) || []).length;
      const closeBraces = (cssContent.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);

      // Check for common CSS patterns
      expect(cssContent).toContain(".dashboard");
      expect(cssContent).toContain(".card");
      expect(cssContent).toContain(".modal");

      // Check for proper CSS property syntax
      expect(cssContent).not.toMatch(/[^:];/); // Properties should have colons
      expect(cssContent).not.toMatch(/\{\s*\}/); // Empty rule sets

    } catch (error) {
      throw new Error(`styles.css has syntax errors: ${error.message}`);
    }
  });

  test("package.json has valid JSON syntax", () => {
    const packagePath = "/Users/alan/Development/HomeDashboard/package.json";

    try {
      const packageContent = readFileSync(packagePath, "utf-8");

      // Parse JSON to ensure it's valid
      const packageJson = JSON.parse(packageContent);

      expect(packageJson).toHaveProperty("name");
      expect(packageJson).toHaveProperty("scripts");
      expect(packageJson.scripts).toHaveProperty("dev");
      expect(packageJson.scripts).toHaveProperty("start");

      // Check for no stray @ characters
      expect(packageContent).not.toMatch(/@(?![\w\/-])/); // Allow valid npm package names

    } catch (error) {
      throw new Error(`package.json has syntax errors: ${error.message}`);
    }
  });

  test("all JavaScript functions are properly defined", () => {
    const scriptPath = "/Users/alan/Development/HomeDashboard/script.js";
    const scriptContent = readFileSync(scriptPath, "utf-8");

    // Check for function definitions
    expect(scriptContent).toContain("function showDayEvents");
    expect(scriptContent).toContain("function showEventDetails");
    expect(scriptContent).toContain("function showTaskDetails");
    expect(scriptContent).toContain("function closeModal");
    expect(scriptContent).toContain("function completeTask");
    expect(scriptContent).toContain("function handleEventAction");

    // Check for async function syntax
    expect(scriptContent).toMatch(/async\s+function/);

    // Check for arrow function syntax
    expect(scriptContent).toContain("=>");

    // Check for proper event listener syntax
    expect(scriptContent).toContain("addEventListener");
    expect(scriptContent).toContain("DOMContentLoaded");
  });

  test("API endpoints are properly defined", () => {
    const scriptPath = "/Users/alan/Development/HomeDashboard/script.js";
    const scriptContent = readFileSync(scriptPath, "utf-8");

    // Check API configuration
    expect(scriptContent).toContain("API_CONFIG");
    expect(scriptContent).toContain("ENDPOINTS");
    expect(scriptContent).toContain("TASKS: \"/api/tasks\"");
    expect(scriptContent).toContain("CALENDAR: \"/api/calendar\"");
    expect(scriptContent).toContain("WEATHER: \"/api/weather\"");
    expect(scriptContent).toContain("TIME: \"/api/time\"");
  });

  test("modal interactions are properly implemented", () => {
    const scriptPath = "/Users/alan/Development/HomeDashboard/script.js";
    const scriptContent = readFileSync(scriptPath, "utf-8");

    // Check for modal-related functionality
    expect(scriptContent).toContain("modal.classList.add(\"active\")");
    expect(scriptContent).toContain("modal.classList.remove(\"active\")");
    expect(scriptContent).toContain("eventModal");
    expect(scriptContent).toContain("taskModal");

    // Check for proper event handling
    expect(scriptContent).toContain("onclick");
    expect(scriptContent).toContain("stopPropagation");
  });

  test("error handling is implemented", () => {
    const scriptPath = "/Users/alan/Development/HomeDashboard/script.js";
    const scriptContent = readFileSync(scriptPath, "utf-8");

    // Check for try-catch blocks
    expect(scriptContent).toContain("try {");
    expect(scriptContent).toContain("} catch");
    expect(scriptContent).toContain("console.error");
    expect(scriptContent).toContain("console.warn");

    // Check for error response handling
    expect(scriptContent).toContain("response.ok");
    expect(scriptContent).toContain("throw new Error");
  });
});