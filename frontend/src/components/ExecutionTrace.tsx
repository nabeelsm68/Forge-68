import React from "react";
import { AgentQueryResponse } from "@/lib/api";
import {
  EnamelSurface,
  VerdictBadge,
} from "@/components/primitives";
import { useTranslation } from "@/lib/i18n";

interface ExecutionTraceProps {
  response: AgentQueryResponse;
}

export function ExecutionTrace({ response }: ExecutionTraceProps) {
  const { t } = useTranslation();
  const plan = response.agent_plan || response.plan;
  const policyDecisions = response.policy_decisions || [];
  const knowledgeEvidence = response.evidence_set?.knowledge_evidence || [];
  const visualEvidence = response.evidence_set?.visual_evidence || [];
  const toolEvidence = response.evidence_set?.tool_evidence || [];
  const verification = response.verification;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          paddingBottom: 12,
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--brass)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {t("traceTitle")}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--ink-3)",
              background: "var(--bg-2)",
              padding: "2px 8px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--line)",
            }}
          >
            {t("traceSubtitle")}
          </span>
        </div>

        {response.execution_event_id && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--ink-3)",
            }}
          >
            {t("traceEventId")} <strong style={{ color: "var(--ink-2)" }}>{response.execution_event_id}</strong>
          </span>
        )}
      </div>

      {/* Sequential Forensic Spine */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Phase 1: Request Ingested */}
        <EnamelSurface variant="elevated" padding="compact">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--bg-0)",
                border: "1px solid var(--line-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--brass)",
                flexShrink: 0,
              }}
            >
              01
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>
                  Operational Query Ingestion
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
                  INGESTED
                </span>
              </div>
              <p style={{ fontFamily: "var(--font-ui)", fontSize: "14px", color: "var(--ink)", lineHeight: 1.5 }}>
                {response.query}
              </p>
            </div>
          </div>
        </EnamelSurface>

        {/* Phase 2: Agent Plan */}
        <EnamelSurface variant="elevated" padding="compact">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--bg-0)",
                border: "1px solid var(--line-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--brass)",
                flexShrink: 0,
              }}
            >
              02
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>
                  Reasoning Plan Formulation
                </span>
                {plan && (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--brass)",
                      background: "rgba(200, 161, 90, 0.08)",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-pill)",
                      border: "1px solid var(--brass)",
                    }}
                  >
                    ACTION: {plan.action.toUpperCase()}
                  </span>
                )}
              </div>

              {plan?.reasoning && (
                <p style={{ fontFamily: "var(--font-ui)", fontSize: "13.5px", color: "var(--ink-2)", fontStyle: "italic", marginBottom: 8 }}>
                  &ldquo;{plan.reasoning}&rdquo;
                </p>
              )}

              {plan && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    fontSize: "12px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--ink-3)",
                    background: "var(--bg-0)",
                    padding: "6px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <span>Knowledge Queries: <strong style={{ color: "var(--ink)" }}>{plan.knowledge_queries?.length || 0}</strong></span>
                  <span>Tool Calls: <strong style={{ color: "var(--ink)" }}>{plan.tool_calls?.length || 0}</strong></span>
                  <span>Calculations: <strong style={{ color: "var(--ink)" }}>{plan.calculations?.length || 0}</strong></span>
                </div>
              )}
            </div>
          </div>
        </EnamelSurface>

        {/* Phase 3: Knowledge Retrieval */}
        {knowledgeEvidence.length > 0 && (
          <EnamelSurface variant="elevated" padding="compact">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--bg-0)",
                  border: "1px solid var(--line-strong)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--brass)",
                  flexShrink: 0,
                }}
              >
                03
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>
                    Sovereign Knowledge Retrieval
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--ink-2)",
                    }}
                  >
                    {knowledgeEvidence.length} chunks retrieved
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {knowledgeEvidence.map((k) => (
                    <div
                      key={k.evidence_id}
                      style={{
                        fontSize: "12px",
                        fontFamily: "var(--font-mono)",
                        background: "var(--bg-0)",
                        padding: "6px 10px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--line)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ color: "var(--ink)" }}>
                        {k.source_reference} ({k.filename})
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "var(--ink-3)" }}>{k.classification}</span>
                        {k.retrieval_score && (
                          <span style={{ color: "var(--brass)" }}>
                            {(k.retrieval_score * 100).toFixed(0)}% match
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </EnamelSurface>
        )}

        {/* Phase 4: Policy Gateway & Tool Execution */}
        {policyDecisions.length > 0 && (
          <EnamelSurface variant="elevated" padding="compact">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--bg-0)",
                  border: "1px solid var(--line-strong)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--brass)",
                  flexShrink: 0,
                }}
              >
                04
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>
                    Policy Gateway Mediation & Sandbox
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--ink-2)",
                    }}
                  >
                    {policyDecisions.length} evaluations
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {policyDecisions.map((pd, idx) => {
                    const isAllow = pd.decision === "ALLOW";
                    return (
                      <div
                        key={idx}
                        style={{
                          background: "var(--bg-0)",
                          border: `1px solid ${isAllow ? "var(--line)" : "rgba(217, 105, 78, 0.4)"}`,
                          padding: "8px 12px",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "11px",
                                fontWeight: 600,
                                color: isAllow ? "var(--sage)" : "var(--coral-text)",
                                background: isAllow ? "rgba(156, 195, 168, 0.1)" : "rgba(217, 105, 78, 0.1)",
                                padding: "2px 8px",
                                borderRadius: "var(--radius-pill)",
                              }}
                            >
                              {pd.decision}
                            </span>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", fontWeight: 600, color: "var(--ink)" }}>
                              {pd.tool}
                            </span>
                          </div>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
                            RULE: {pd.policy_id || "GATEWAY_RULE"}
                          </span>
                        </div>

                        <p style={{ fontFamily: "var(--font-ui)", fontSize: "12.5px", color: "var(--ink-2)", marginTop: 4 }}>
                          {pd.reason}
                        </p>
                      </div>
                    );
                  })}
                  {toolEvidence.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
                        Executed Sandbox Tools ({toolEvidence.length}):
                      </span>
                      {toolEvidence.map((te) => (
                        <div
                          key={te.evidence_id}
                          style={{
                            background: "var(--bg-0)",
                            border: "1px solid var(--line)",
                            padding: "6px 10px",
                            borderRadius: "var(--radius-sm)",
                            fontFamily: "var(--font-mono)",
                            fontSize: "11.5px",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ color: "var(--sage)" }}>{te.source_reference}</span>
                          <span style={{ color: "var(--ink-3)" }}>ID: {te.evidence_id.slice(0, 12)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </EnamelSurface>
        )}

        {/* Phase 5: Visual Ingestion (if present) */}
        {visualEvidence.length > 0 && (
          <EnamelSurface variant="elevated" padding="compact">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--bg-0)",
                  border: "1px solid var(--line-strong)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--brass)",
                  flexShrink: 0,
                }}
              >
                05
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>
                    Engineering Vision Observation
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--ink-2)",
                    }}
                  >
                    {visualEvidence.length} visual records
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {visualEvidence.map((v) => (
                    <div
                      key={v.evidence_id}
                      style={{
                        fontSize: "12px",
                        background: "var(--bg-0)",
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--line)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--brass)" }}>
                          {v.finding_type || "OBSERVATION"}
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
                          SHA256: {v.source_image_hash?.slice(0, 16)}...
                        </span>
                      </div>
                      <p style={{ fontFamily: "var(--font-ui)", color: "var(--ink-2)", fontSize: "12.5px" }}>
                        {v.retrieved_text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </EnamelSurface>
        )}

        {/* Phase 6: Deterministic Verification */}
        {verification && (
          <EnamelSurface variant="elevated" padding="compact">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--bg-0)",
                  border: "1px solid var(--line-strong)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--sage)",
                  flexShrink: 0,
                }}
              >
                06
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>
                    Independent Deterministic Verification
                  </span>
                  <VerdictBadge verdict={verification.status} />
                </div>

                <p style={{ fontFamily: "var(--font-ui)", fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.5 }}>
                  {verification.summary}
                </p>
              </div>
            </div>
          </EnamelSurface>
        )}

        {/* Phase 7: Grounded Final Response */}
        <EnamelSurface variant="elevated" padding="compact" style={{ border: "1px solid var(--line-strong)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--bg-0)",
                border: "1px solid var(--brass)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--brass)",
                flexShrink: 0,
              }}
            >
              07
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "var(--brass)" }}>
                  Verified Case Briefing Delivered
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--sage)",
                  }}
                >
                  OPERATOR PRESENTATION
                </span>
              </div>

              <div
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "14px",
                  color: "var(--ink)",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  background: "var(--bg-0)",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--line)",
                }}
              >
                {response.final_answer}
              </div>
            </div>
          </div>
        </EnamelSurface>
      </div>
    </div>
  );
}
