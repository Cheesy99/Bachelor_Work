import { test, expect, _electron } from "@playwright/test";
import { resolve } from "path";

let electronApp: Awaited<ReturnType<typeof _electron.launch>>;
let mainPage: Awaited<ReturnType<typeof electronApp.firstWindow>>;

async function waitForPreloadScript() {
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      const electronBridge = await mainPage.evaluate(() => {
        return (window as Window & { electron?: any }).electron;
      });
      if (electronBridge) {
        clearInterval(interval);
        resolve(true);
      }
    }, 100);
  });
}

test.beforeEach(async () => {
  electronApp = await _electron.launch({
    args: ["."],
    env: { NODE_ENV: "development" },
  });
  mainPage = await electronApp.firstWindow();
  // await mainPage.waitForLoadState("domcontentloaded");
  // await waitForPreloadScript();
});

test.afterAll(async () => {
  await electronApp.close();
});

test.afterEach(async () => {
  await electronApp.close();
});

test("should open a window", async () => {
  const windowCount = await electronApp.windows();
  expect(windowCount.length).toBeGreaterThan(0);
});

test("should display the SmallSidePanel", async () => {
  // Wait for the element to be present
  await mainPage.waitForSelector(".small_panel");
  const smallSidePanel = await mainPage.$(".small_panel");
  expect(smallSidePanel).not.toBeNull();
});
