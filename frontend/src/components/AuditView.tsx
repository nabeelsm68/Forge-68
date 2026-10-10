"use client";

import React, { useEffect, useState } from "react";
import {
  AgentTraceEvent,
  AuditEventsResponse,
  ExecutionEvent,
  fetchAuditEvents,
  resetDemo,
} from "@/lib/api";
import {
  EnamelSurface,
  BrassLabel,
  Divider,
} from "@/components/primitives";
import { useTranslation } from "@/lib/i18n";
import { ReadAloudButton } from "@/components/ReadAloudButton";

type EventFilter = "ALL" | "AGENT" | "TOOL" | "POLICY" | "VERIFICATION" | "KNOWLEDGE";

function formatISTTimestamp(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return (
      d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }) + " IST"
    );
  } catch {
    return isoString;
  }
}

export function AuditView() {
  const { t } = useTranslation();
  const [auditData, setAuditData] = useState<AuditEventsResponse | null>(null);
  const [filter, setFilter] = useState<EventFilter>("ALL");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAuditData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAuditEvents(100);
      setAuditData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAudit = async () => {
    setIsResetting(true);
    setError(null);
    try {
      const res = await resetDemo();
      setResetMessage(`Cleared ${res.cleared_audit_events_count} transient audit events.`);
      await loadAuditData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchAuditEvents(100)
      .then((res) => {
        if (active) {
          setAuditData(res);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : String(err));
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedEventId((prev) => (prev === id ? null : id));
  };

  // Combine agent and tool events into unified timeline
  interface UnifiedEvent {
    id: string;
    runId?: string;
    scenarioId?: string;
    tool?: string;
    policy?: string;
    timestamp: string;
    type: string;
    category: "AGENT" | "TOOL" | "POLICY" | "VERIFICATION" | "KNOWLEDGE";
    actor: string;
    role: string;
    summary: string;
    decision?: string;
    raw: Record<string, unknown>;
  }

  const agentEvents: UnifiedEvent[] = (auditData?.agent_events || []).map((e: AgentTraceEvent) => {
    let cat: UnifiedEvent["category"] = "AGENT";
    if (e.event_type.includes("KNOWLEDGE")) cat = "KNOWLEDGE";
    else if (e.event_type.includes("POLICY")) cat = "POLICY";
    else if (e.event_type.includes("VERIFICATION")) cat = "VERIFICATION";
    else if (e.event_type.includes("TOOL")) cat = "TOOL";

    const details = (e.details || {}) as Record<string, unknown>;
    const runId = (details.run_id as string) || undefined;
    const scenarioId = (details.scenario_id as string) || undefined;
    const tool = (details.tool_name as string) || (details.tool as string) || undefined;
    const policy = (details.policy_id as string) || (details.policy as string) || undefined;

    const summary = details?.query
      ? String(details.query)
      : details?.reasoning
      ? String(details.reasoning)
      : details?.summary
      ? String(details.summary)
      : JSON.stringify(details);

    return {
      id: e.event_id,
      runId,
      scenarioId,
      tool,
      policy,
      timestamp: e.timestamp,
      type: e.event_type,
      category: cat,
      actor: e.requester || "engineer_operator",
      role: e.role || "ENGINEER",
      summary,
      raw: details,
    };
  });

  const toolEvents: UnifiedEvent[] = (auditData?.tool_events || []).map((te: ExecutionEvent) => {
    const params = (te.parameters || {}) as Record<string, unknown>;
    const runId = (params.run_id as string) || undefined;

    return {
      id: te.event_id,
      runId,
      tool: te.tool,
      policy: te.reason,
      timestamp: te.timestamp,
      type: `TOOL_${te.tool.toUpperCase()}`,
      category: "TOOL",
      actor: te.requester,
      role: te.role,
      summary: `Tool '${te.tool}' evaluated: ${te.decision} (${te.reason})`,
      decision: te.decision,
      raw: te as unknown as Record<string, unknown>,
    };
  });

  const allEvents = [...agentEvents, ...toolEvents].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const filteredEvents = allEvents.filter((e) => {
    if (filter === "ALL") return true;
    return e.category === filter;
  });

  const totalEventsCount = (auditData?.total_agent_events || 0) + (auditData?.total_tool_events || 0);

  // Human-readable title & summary helper
  const getEventHumanExplanation = (evt: UnifiedEvent) => {
    const isDenied = evt.decision === "DENY" || evt.type.includes("DENIED");

    if (evt.type.includes("QUERY") || (evt.category === "AGENT" && evt.type.includes("START"))) {
      return {
        humanTitle: t("auditEvtQuestionTitle"),
        explanation: t("auditEvtQuestionDesc"),
      };
    }
    if (evt.category === "KNOWLEDGE") {
      return {
        humanTitle: t("auditEvtRecordsTitle"),
        explanation: t("auditEvtRecordsDesc"),
      };
    }
    if (evt.category === "POLICY") {
      if (isDenied) {
        return {
          humanTitle: t("auditEvtPermBlockedTitle"),
          explanation: t("auditEvtPermBlockedDesc").replace("{role}", evt.role),
        };
      }
      return {
        humanTitle: t("auditEvtPermAllowedTitle"),
        explanation: t("auditEvtPermAllowedDesc").replace("{role}", evt.role),
      };
    }
    if (evt.category === "TOOL") {
      if (isDenied) {
        return {
          humanTitle: t("auditEvtToolBlockedTitle"),
          explanation: t("auditEvtToolBlockedDesc"),
        };
      }
      return {
        humanTitle: t("auditEvtToolAllowedTitle"),
        explanation: t("auditEvtToolAllowedDesc"),
      };
    }
    if (evt.category === "VERIFICATION") {
      return {
        humanTitle: t("auditEvtVerifiedTitle"),
        explanation: t("auditEvtVerifiedDesc"),
      };
    }
    return {
      humanTitle: evt.type.replace(/_/g, " "),
      explanation: evt.summary,
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header Banner */}
      <EnamelSurface variant="base" padding="spacious">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
              <BrassLabel variant="outline">{t("auditActivityTag")}</BrassLabel>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
                {t("auditForensicLogTag")}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--sage)",
                  background: "rgba(156, 195, 168, 0.08)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--sage)",
                }}
              >
                {t("auditAppendOnlyTag")}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "38px", color: "var(--ink)", fontWeight: 500, lineHeight: 1.1 }}>
                {t("auditTitle")}
              </h1>
              <ReadAloudButton text={`${t("auditTitle")}. ${t("auditSubtitle")}`} />
            </div>

            <p style={{ fontFamily: "var(--font-ui)", fontSize: "15px", color: "var(--ink-2)", marginTop: 6, maxWidth: 680 }}>
              {t("auditSubtitle")}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={handleResetAudit}
              disabled={isLoading || isResetting}
              className="btn-brass-secondary"
              style={{ fontSize: "12px", padding: "6px 14px", cursor: isResetting ? "not-allowed" : "pointer" }}
            >
              {isResetting ? t("auditResetting") : t("auditResetButton")}
            </button>
            <button
              onClick={loadAuditData}
              disabled={isLoading}
              className="btn-brass-secondary"
              style={{ fontSize: "12px", padding: "6px 14px" }}
            >
              {isLoading ? t("auditRefreshing") : t("auditRefresh")}
            </button>
          </div>
        </div>

        {resetMessage && (
          <div
            style={{
              marginTop: 12,
              padding: "8px 12px",
              background: "rgba(156, 195, 168, 0.08)",
              border: "1px solid var(--sage)",
              borderRadius: "var(--radius-sm)",
              fontSize: "12.5px",
              color: "var(--sage)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>✓ {resetMessage}</span>
            <button
              onClick={() => setResetMessage(null)}
              style={{ background: "none", border: "none", color: "var(--sage)", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        )}

        <Divider style={{ margin: "20px 0" }} />

        {/* Readable Chronological Lifecycle Flows Guide */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }} className="audit-flow-grid">
          <div
            style={{
              background: "var(--bg-0)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-panel)",
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ color: "var(--sage)", fontSize: "12px" }}>✓</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--sage)", fontWeight: 600 }}>
                {t("auditNormalFlowTitle")}
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11.5px",
                color: "var(--ink)",
                lineHeight: 1.8,
              }}
            >
              {t("auditNormalFlow1")}<br />
              <span style={{ color: "var(--ink-3)" }}>↓</span> {t("auditNormalFlow2")}<br />
              <span style={{ color: "var(--ink-3)" }}>↓</span> {t("auditNormalFlow3")}<br />
              <span style={{ color: "var(--ink-3)" }}>↓</span> {t("auditNormalFlow4")}<br />
              <span style={{ color: "var(--ink-3)" }}>↓</span> {t("auditNormalFlow5")}<br />
              <span style={{ color: "var(--sage)" }}>↓ {t("auditNormalFlow6")}</span>
            </div>
          </div>

          <div
            style={{
              background: "var(--bg-0)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-panel)",
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ color: "var(--coral)", fontSize: "12px" }}>✕</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--coral-text)", fontWeight: 600 }}>
                {t("auditBlockedFlowTitle")}
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11.5px",
                color: "var(--ink)",
                lineHeight: 1.8,
              }}
            >
              {t("auditBlockedFlow1")}<br />
              <span style={{ color: "var(--ink-3)" }}>↓</span> {t("auditBlockedFlow2")}<br />
              <span style={{ color: "var(--coral-text)", fontWeight: 600 }}>↓ {t("auditBlockedFlow3")}</span><br />
              <span style={{ color: "var(--ink-3)" }}>↓ {t("auditBlockedFlow4")}</span>
            </div>
          </div>
        </div>

        {/* Fact KPI Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            background: "var(--bg-0)",
            padding: "16px 20px",
            borderRadius: "var(--radius-panel)",
            border: "1px solid var(--line)",
          }}
        >
          <div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
              {t("auditKpiTotal")}
            </span>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--brass)", fontWeight: 600, marginTop: 2 }}>
              {totalEventsCount}
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
              {t("auditKpiAgent")}: {auditData?.total_agent_events || 0}
            </span>
          </div>

          <div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
              {t("auditKpiTool")}
            </span>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--sage)", fontWeight: 600, marginTop: 2 }}>
              {auditData?.total_tool_events || 0}
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
              {t("auditKpiGateway")}
            </span>
          </div>

          <div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
              {t("auditKpiStorage")}
            </span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink)", fontWeight: 600, marginTop: 8 }}>
              {t("auditKpiStorageVal")}
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
              {t("auditKpiStorageSub")}
            </span>
          </div>

          <div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
              {t("auditKpiOutside")}
            </span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--sage)", fontWeight: 600, marginTop: 8 }}>
              {t("auditKpiOutsideVal")}
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
              {t("auditKpiOutsideSub")}
            </span>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 14px",
              background: "rgba(217, 105, 78, 0.1)",
              border: "1px solid var(--coral)",
              borderRadius: "var(--radius-sm)",
              color: "var(--coral-text)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
            }}
          >
            [AUDIT ERROR] {error}
          </div>
        )}
      </EnamelSurface>

      {/* Forensic Timeline View */}
      <EnamelSurface variant="base" padding="spacious">
        {/* Filter bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--brass)", letterSpacing: "0.06em" }}>
              {t("auditSpineTag")} ({filteredEvents.length} {t("auditEventsCount")})
            </span>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: t("auditFilterAll") },
              { id: "AGENT", label: t("auditFilterAgent") },
              { id: "KNOWLEDGE", label: t("auditFilterKnowledge") },
              { id: "POLICY", label: t("auditFilterPolicy") },
              { id: "TOOL", label: t("auditFilterTool") },
              { id: "VERIFICATION", label: t("auditFilterVerification") },
            ].map((catItem) => {
              const cat = catItem.id as EventFilter;
              const isSelected = filter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  style={{
                    background: isSelected ? "var(--bg-3)" : "var(--bg-0)",
                    border: isSelected ? "1px solid var(--brass)" : "1px solid var(--line)",
                    borderRadius: "var(--radius-pill)",
                    color: isSelected ? "var(--ink)" : "var(--ink-3)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    padding: "4px 12px",
                    cursor: "pointer",
                    transition: "all var(--dur-fast) var(--ease-out)",
                  }}
                >
                  {catItem.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline Events List */}
        {filteredEvents.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredEvents.map((evt, idx) => {
              const isExpanded = expandedEventId === evt.id;
              const isDenied = evt.decision === "DENY" || evt.type.includes("DENIED");
              const isVerified = evt.type.includes("VERIFIED") || evt.decision === "ALLOW";
              const humanInfo = getEventHumanExplanation(evt);

              return (
                <div
                  key={evt.id}
                  style={{
                    background: "var(--bg-0)",
                    border: "1px solid var(--line)",
                    borderLeft: `3px solid ${isDenied ? "var(--coral)" : isVerified ? "var(--sage)" : "var(--brass)"}`,
                    borderRadius: "var(--radius-panel)",
                    padding: "14px 18px",
                    transition: "border-color var(--dur-fast) var(--ease-out)",
                  }}
                >
                  {/* Event Top Bar */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
                        #{String(idx + 1).padStart(3, "0")}
                      </span>
                      <span style={{ fontFamily: "var(--font-ui)", fontSize: "15px", color: "var(--ink)", fontWeight: 600 }}>
                        {humanInfo.humanTitle}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          color: isDenied ? "var(--coral-text)" : isVerified ? "var(--sage)" : "var(--ink-3)",
                          border: `1px solid ${isDenied ? "var(--coral)" : isVerified ? "var(--sage)" : "var(--line)"}`,
                          padding: "1px 6px",
                          borderRadius: "var(--radius-pill)",
                          background: isDenied ? "rgba(217, 105, 78, 0.08)" : isVerified ? "rgba(156, 195, 168, 0.08)" : "transparent",
                        }}
                      >
                        {evt.type}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span
                        title={evt.timestamp}
                        style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)", cursor: "help" }}
                      >
                        {formatISTTimestamp(evt.timestamp)}
                      </span>
                      <ReadAloudButton text={humanInfo.explanation} compact />
                      <button
                        onClick={() => toggleExpand(evt.id)}
                        style={{
                          background: "var(--bg-1)",
                          border: "1px solid var(--line)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--brass)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          padding: "3px 8px",
                          cursor: "pointer",
                        }}
                      >
                        {isExpanded ? t("auditJsonClose") : t("auditJsonInspect")}
                      </button>
                    </div>
                  </div>

                  {/* Plain Language Human Explanation */}
                  <div style={{ marginTop: 8 }}>
                    <p style={{ fontFamily: "var(--font-ui)", fontSize: "13.5px", color: "var(--ink-2)", lineHeight: 1.5 }}>
                      {humanInfo.explanation}
                    </p>
                  </div>

                  {/* Context Meta Line */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 12,
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: "1px solid var(--line)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--ink-3)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span>
                        {t("auditActor")}: <strong style={{ color: "var(--ink-2)" }}>{evt.actor}</strong> ({evt.role})
                      </span>
                      {evt.runId && (
                        <span>
                          {t("auditRunId")}: <strong style={{ color: "var(--brass)" }}>{evt.runId}</strong>
                        </span>
                      )}
                      {evt.tool && (
                        <span>
                          {t("auditTool")}: <strong style={{ color: "var(--sage)" }}>{evt.tool}</strong>
                        </span>
                      )}
                      {evt.scenarioId && (
                        <span>
                          {t("auditScenario")}: <strong style={{ color: "var(--ink)" }}>{evt.scenarioId}</strong>
                        </span>
                      )}
                    </div>
                    <span>
                      {t("auditEventId")}: {evt.id}
                    </span>
                  </div>

                  {/* Expandable Technical Inspector (Raw Payload) */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: 10,
                        background: "var(--bg-1)",
                        padding: "12px 14px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--line)",
                        overflowX: "auto",
                      }}
                    >
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--brass)", marginBottom: 4 }}>
                        {t("auditJsonTitle")}:
                      </div>
                      <pre
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          color: "var(--ink-2)",
                          margin: 0,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-all",
                        }}
                      >
                        {JSON.stringify(evt.raw, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--ink-3)" }}>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--ink-2)", marginBottom: 6 }}>
              {t("auditEmptyTitle")}
            </p>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "13px" }}>
              {t("auditEmptyDesc")}
            </p>
          </div>
        )}
      </EnamelSurface>
    </div>
  );
}
