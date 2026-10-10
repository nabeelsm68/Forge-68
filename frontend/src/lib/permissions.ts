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
  INSPECTOR: {
    role: "INSPECTOR",
    label: "Inspector",
    defaultClearance: "INTERNAL",
    summary: "Auditing & inspection role. Reviews ultrasonic surveys, inspection logs, and gauge readings. Actuation blocked.",
    read: "ALLOWED",
    investigate: "ALLOWED",
    actuate: "BLOCKED",
    admin: "BLOCKED",
    bulletPoints: [
      "Read ultrasonic inspection reports (PAUT)",
      "Read historical inspection & telemetry logs",
      "Run non-destructive evaluation workflows",
      "Physical tool actuation strictly blocked",
      "Administrative overrides blocked",
    ],
    actuationExplanation: "Inspectors have read-only diagnostic clearance. Physical machinery actuation is strictly blocked.",
  },
  AI_OPERATOR: {
    role: "AI_OPERATOR",
    label: "AI Operator",
    defaultClearance: "RESTRICTED",
    summary: "Autonomous workflow operator. Approved investigation access with zero write or physical actuation authority.",
    read: "ALLOWED",
    investigate: "ALLOWED",
    actuate: "BLOCKED",
    admin: "BLOCKED",
    bulletPoints: [
      "Approved investigation and query access",
      "Zero write authority to control systems",
      "Physical tool actuation strictly blocked",
      "Adversarial or untrusted inputs quarantined",
      "Administrative overrides blocked",
    ],
    actuationExplanation: "AI Operators operate within a zero-write sandbox. Actuation commands are intercepted and blocked.",
  },
  ADMIN: {
    role: "ADMIN",
    label: "Administrator",
    defaultClearance: "CRITICAL",
    summary: "Broad operational authority. Administrative controls available; critical machine actuation mandates supervisor approval.",
    read: "ALLOWED",
    investigate: "ALLOWED",
    actuate: "NEEDS_APPROVAL",
    admin: "ALLOWED",
    bulletPoints: [
      "Broadest read access across all plant data",
      "Administrative system configuration controls",
      "Critical actuation strictly requires supervisor approval (no bypass)",
      "All actions subject to immutable local audit logging",
    ],
    actuationExplanation: "Administrators cannot unilaterally bypass critical actuation safety gates. Approval is strictly required.",
  },
  SECURITY_OFFICER: {
    role: "SECURITY_OFFICER",
    label: "Security Officer",
    defaultClearance: "CRITICAL",
    summary: "Security oversight role. Full audit visibility, boundary verification, and attack testing. Actuation blocked.",
    read: "ALLOWED",
    investigate: "ALLOWED",
    actuate: "BLOCKED",
    admin: "BLOCKED",
    bulletPoints: [
      "Inspect tamper-evident audit logs & trace events",
      "Run adversarial security boundary tests",
      "Plant machinery actuation strictly blocked",
      "Direct administrative override blocked",
    ],
    actuationExplanation: "Security Officers maintain security oversight and cannot actuate physical industrial equipment.",
  },
  MANAGER: {
    role: "MANAGER",
    label: "Plant Manager",
    defaultClearance: "CONFIDENTIAL",
    summary: "Plant management role. Broad operational oversight with supervisory approval authority.",
    read: "ALLOWED",
    investigate: "ALLOWED",
    actuate: "NEEDS_APPROVAL",
    admin: "NEEDS_APPROVAL",
    bulletPoints: [
      "Broad oversight across plant units",
      "Approval authority for critical operational actuation",
      "Read plant records and inspection reports",
      "Administrative changes require verification",
    ],
    actuationExplanation: "Managers can authorize actuation workflows under logged policy checks.",
  },
  AUDITOR: {
    role: "AUDITOR",
    label: "Auditor",
    defaultClearance: "INTERNAL",
    summary: "Compliance & compliance audit role. Read-only access to audit logs and plant runbooks.",
    read: "ALLOWED",
    investigate: "ALLOWED",
    actuate: "BLOCKED",
    admin: "BLOCKED",
    bulletPoints: [
      "Read-only access to compliance & audit logs",
      "Read operating standards and procedures",
      "Zero physical tool actuation authority",
      "Administrative overrides strictly blocked",
    ],
    actuationExplanation: "Auditors possess read-only inspection clearance without execution authority.",
  },
};
