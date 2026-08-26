export function isAiAgentEnabled() {
  // Off by default: merging this branch changes nothing visible until the backend exposes the
  // /api/v1/ai/** gateway route. Set VITE_FEATURE_AI_AGENT=true to turn the AI surfaces on.
  return String(import.meta.env.VITE_FEATURE_AI_AGENT ?? "false").toLowerCase() === "true";
}
