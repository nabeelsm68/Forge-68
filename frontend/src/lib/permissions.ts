import { Role, DataClassification } from "./api";

export interface RolePermissionConfig {
  role: Role;
  label: string;
  defaultClearance: DataClassification;
  summary: string;
  read: "ALLOWED" | "NEEDS_APPROVAL" | "BLOCKED";
  investigate: "ALLOWED" | "NEEDS_APPROVAL" | "BLOCKED";
  actuate: "ALLOWED" | "NEEDS_APPROVAL" | "BLOCKED";
  admin: "ALLOWED" | "NEEDS_APPROVAL" | "BLOCKED";
  bulletPoints: string[];
  actuationExplanation: string;
}

export const ROLE_PERMISSIONS: Record<Role, RolePermissionConfig> = {
  VIEWER: {
    role: "VIEWER",
    label: "Viewer",
    defaultClearance: "INTERNAL",
    summary: "Read-only observer role. Cannot execute privileged or active tools.",
    read: "ALLOWED",
    investigate: "BLOCKED",
    actuate: "BLOCKED",
    admin: "BLOCKED",
    bulletPoints: [
      "Read plant telemetry & equipment dashboard displays",
      "Read public and internal plant documentation",
      "Tool execution strictly blocked under default-deny policy",
      "Physical machinery actuation strictly blocked",
      "Administrative overrides blocked",
    ],
    actuationExplanation: "Viewers have read-only visibility. All active tool operations and investigations are blocked.",
  },
  ENGINEER: {
    role: "ENGINEER",
    label: "Engineer",
    defaultClearance: "CONFIDENTIAL",
    summary: "Standard operational role. Runs investigations and read-only tools. Critical valve actuation requires approval.",
    read: "ALLOWED",
    investigate: "ALLOWED",
    actuate: "NEEDS_APPROVAL",
    admin: "BLOCKED",
    bulletPoints: [
      "Read plant telemetry & equipment data",
      "Read operating procedures (SOPs)",
      "Run operational investigations",
      "Read-only diagnostics & calculation tools",
      "Critical valve actuation requires supervisor approval",
      "Administrative system overrides blocked",
    ],
    actuationExplanation: "Engineers can investigate and read sensors, but cannot calibrate critical valves without secondary approval.",
  },
  ADMINISTRATOR: {
    role: "ADMINISTRATOR",
    label: "Administrator",
    defaultClearance: "CRITICAL",
    summary: "Administrative authority. Administrative/security testing capabilities; critical actuation strictly requires approval.",
    read: "ALLOWED",
    investigate: "ALLOWED",
    actuate: "NEEDS_APPROVAL",
    admin: "ALLOWED",
    bulletPoints: [
      "Broadest read access across all plant data",
      "Execute security boundary and quarantine verification tests",
      "Critical valve calibration strictly requires supervisor approval (no bypass)",
      "All actions subject to immutable local audit logging",
    ],
    actuationExplanation: "Administrators cannot unilaterally bypass critical actuation safety gates. Shift supervisor approval is strictly required.",
  },
};
