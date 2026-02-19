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
  window.history.replaceState({}, "", "/");
});
