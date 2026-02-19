import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Recharts uses ResizeObserver in ResponsiveContainer.
// jsdom does not implement it natively.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).ResizeObserver = ResizeObserverMock;

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.classList.remove("theme-light", "theme-dark");
  document.body.removeAttribute("data-theme");
  document.body.classList.remove("theme-light", "theme-dark");
  window.history.replaceState({}, "", "/");
});
