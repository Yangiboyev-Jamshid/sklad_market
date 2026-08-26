import { afterEach, describe, expect, it, vi } from "vitest";
import { isAiAgentEnabled } from "../flag";

describe("AI agent feature flag", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is disabled when no build-time flag is supplied", () => {
    vi.stubEnv("VITE_FEATURE_AI_AGENT", undefined);
    expect(isAiAgentEnabled()).toBe(false);
  });

  it("is enabled by an explicit opt-in", () => {
    vi.stubEnv("VITE_FEATURE_AI_AGENT", "true");
    expect(isAiAgentEnabled()).toBe(true);
  });

  it("stays disabled for an explicit false", () => {
    vi.stubEnv("VITE_FEATURE_AI_AGENT", "false");
    expect(isAiAgentEnabled()).toBe(false);
  });
});
