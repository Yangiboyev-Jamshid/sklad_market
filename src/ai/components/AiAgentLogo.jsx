import aiAgentLogo from "../../assets/ai-agent-logo.svg";

export default function AiAgentLogo({ size = 24, className = "", label, ...props }) {
  return (
    <img
      src={aiAgentLogo}
      width={size}
      height={size}
      alt={label || ""}
      aria-hidden={label ? undefined : true}
      className={`shrink-0 ${className}`.trim()}
      {...props}
    />
  );
}
