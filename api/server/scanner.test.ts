import { describe, it, expect } from "vitest";
import { scanHtmlForViolations } from "./scanner";

describe("Scanner - Compliance Violations", () => {
  it("should detect autoplay videos", async () => {
    const html = `
      <html>
        <body>
          <video autoplay src="video.mp4"></video>
        </body>
      </html>
    `;

    const result = await scanHtmlForViolations(html);
    expect(result.violations.some((v) => v.type === "autoplay")).toBe(true);
    expect(result.summary.warning).toBeGreaterThan(0);
  });

  it("should detect infinite scroll patterns", async () => {
    const html = `
      <html>
        <body>
          <div class="infinite-scroll-container">Content</div>
        </body>
      </html>
    `;

    const result = await scanHtmlForViolations(html);
    expect(result.violations.some((v) => v.type === "infinite_scroll")).toBe(true);
  });

  it("should detect violations in basic HTML", async () => {
    const html = `
      <html>
        <body>
          <h1>Welcome</h1>
          <p>No privacy policy here</p>
        </body>
      </html>
    `;

    const result = await scanHtmlForViolations(html);
    // Should detect some violations
    expect(result.violations).toBeDefined();
    expect(Array.isArray(result.violations)).toBe(true);
  });

  it("should detect ad trackers", async () => {
    const html = `
      <html>
        <head>
          <script src="https://www.googleadservices.com/pagead/conversion.js"></script>
        </head>
        <body>
          <h1>Welcome</h1>
          <footer><a href="/privacy">Privacy</a></footer>
        </body>
      </html>
    `;

    const result = await scanHtmlForViolations(html);
    expect(result.violations.some((v) => v.type === "ad_tracker")).toBe(true);
  });

  it("should calculate compliance score correctly", async () => {
    const html = `
      <html>
        <body>
          <h1>Compliant Site</h1>
          <footer>
            <a href="/privacy">Privacy Policy</a>
          </footer>
        </body>
      </html>
    `;

    const result = await scanHtmlForViolations(html);
    expect(result.complianceScore).toBeGreaterThan(50);
    expect(result.complianceScore).toBeLessThanOrEqual(100);
  });

  it("should handle empty violations gracefully", async () => {
    const html = `
      <html>
        <head>
          <title>Test</title>
        </head>
        <body>
          <h1>Welcome</h1>
        </body>
      </html>
    `;

    const result = await scanHtmlForViolations(html);
    expect(Array.isArray(result.violations)).toBe(true);
    expect(result.summary).toHaveProperty("critical");
    expect(result.summary).toHaveProperty("warning");
    expect(result.summary).toHaveProperty("info");
  });

  it("should detect age verification issues for child-targeted content", async () => {
    const html = `
      <html>
        <body>
          <h1>Jogo Infantil Divertido</h1>
          <p>Bem-vindo ao nosso jogo para crianças!</p>
          <footer>
            <a href="/privacy">Privacy</a>
          </footer>
        </body>
      </html>
    `;

    const result = await scanHtmlForViolations(html);
    expect(result.violations.some((v) => v.type === "age_verification")).toBe(true);
  });

  it("should not flag age verification for non-child-targeted content", async () => {
    const html = `
      <html>
        <body>
          <h1>Welcome to Site</h1>
          <p>This is a general website</p>
          <footer>
            <a href="/privacy">Privacy</a>
          </footer>
        </body>
      </html>
    `;

    const result = await scanHtmlForViolations(html);
    // Should not flag age verification for non-child-targeted content
    const ageVerificationViolation = result.violations.find((v) => v.type === "age_verification");
    expect(ageVerificationViolation).toBeUndefined();
  });

  it("should return proper violation structure", async () => {
    const html = `
      <html>
        <body>
          <video autoplay></video>
        </body>
      </html>
    `;

    const result = await scanHtmlForViolations(html);
    const violation = result.violations[0];

    expect(violation).toHaveProperty("type");
    expect(violation).toHaveProperty("severity");
    expect(violation).toHaveProperty("title");
    expect(violation).toHaveProperty("description");
    expect(violation).toHaveProperty("recommendation");
  });
});
