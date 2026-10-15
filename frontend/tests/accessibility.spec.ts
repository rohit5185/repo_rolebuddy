import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BLOCKING_IMPACTS = new Set(["critical", "serious"]);

function formatViolations(
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]
) {
  return violations
    .filter((v) => BLOCKING_IMPACTS.has(v.impact ?? ""))
    .map(
      (v) =>
        `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node(s)) — ${v.helpUrl}`
    )
    .join("\n");
}

test.describe("accessibility", () => {
  test("login page has no serious or critical axe violations", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter((v) =>
      BLOCKING_IMPACTS.has(v.impact ?? "")
    );

    expect(
      blocking,
      blocking.length ? formatViolations(results.violations) : undefined
    ).toEqual([]);
  });

  test("signup page has no serious or critical axe violations", async ({ page }) => {
    await page.goto("/signup");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter((v) =>
      BLOCKING_IMPACTS.has(v.impact ?? "")
    );

    expect(
      blocking,
      blocking.length ? formatViolations(results.violations) : undefined
    ).toEqual([]);
  });
});
