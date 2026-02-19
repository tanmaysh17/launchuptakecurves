import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "../App";

describe("app smoke", () => {
  it("renders default richards state", () => {
    render(<App />);
    expect(screen.getByText("Launch Uptake")).toBeInTheDocument();
    expect(screen.getByText("Modeler")).toBeInTheDocument();
    expect(screen.getByText(/Active: Richards/i)).toBeInTheDocument();
  });

  it("switches right panel tabs", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Table/i }));
    expect(screen.getByRole("button", { name: /Export CSV/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Chart$/i }));
    expect(screen.getByRole("button", { name: /Share/i })).toBeInTheDocument();
  });

  it("adds and renames a scenario", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Add Scenario/i }));
    const scenarioInput = screen.getByDisplayValue("Scenario A");
    expect(scenarioInput).toBeInTheDocument();
    await user.clear(scenarioInput);
    await user.type(scenarioInput, "Base Case");
    expect(screen.getByDisplayValue("Base Case")).toBeInTheDocument();
  });

  it("loads fit data text area", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Fit To Data/i }));
    const textarea = screen.getByPlaceholderText(/period,adoption%/i);
    await user.clear(textarea);
    await user.type(textarea, "period,adoption%{enter}1,0.3{enter}2,0.8");
    const fitSection = screen.getByText(/Model Comparison/i).closest("div");
    expect(fitSection).not.toBeNull();
  });

  it("shows model selector choices", () => {
    render(<App />);
    expect(screen.getByText("Gompertz")).toBeInTheDocument();
    expect(screen.getAllByText("Richards").length).toBeGreaterThan(0);
  });
});
