"use client";

import React from "react";
import { DataClassification, Role } from "@/lib/api";

export type NavTab = "overview" | "workspace" | "knowledge" | "evidence" | "verification" | "audit" | "sovereignty";

interface NavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  role: Role;
  onChangeRole: (role: Role) => void;
  clearance: DataClassification;
  onChangeClearance: (c: DataClassification) => void;
  backendOnline: boolean;
  modelProviderOnline?: boolean;
  version: string;
}

export function Navigation({
  activeTab,
  onSelectTab,
  role,
  onChangeRole,
  clearance,
  onChangeClearance,
  backendOnline,
  modelProviderOnline = false,
  version,
}: NavigationProps) {
  const tabs: Array<{ id: NavTab; label: string; tag: string }> = [
    { id: "overview", label: "Overview", tag: "DASHBOARD" },
    { id: "workspace", label: "AI Workspace", tag: "PRIMARY" },
    { id: "knowledge", label: "Knowledge", tag: "FABRIC" },
    { id: "evidence", label: "Evidence", tag: "REGISTRY" },
    { id: "verification", label: "Verification", tag: "ENGINE" },
    { id: "audit", label: "Audit", tag: "APPEND-ONLY" },
    { id: "sovereignty", label: "Sovereignty", tag: "LOCAL-ONLY" },
  ];

  return (
    <header style={{
      background: "var(--bg-surface)",
      borderBottom: "1px solid var(--bg-surface-border)",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      {/* Top Status Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              fontSize: "1.25rem",
              letterSpacing: "0.1em",
              color: "var(--accent-cyan)",
            }}>
              FORGE
            </span>
            <span style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              letterSpacing: "0.05em",
              fontFamily: "var(--font-mono)",
            }}>
              SOVEREIGN CONTROL PLANE v{version}
            </span>
          </div>

          <span className="badge badge-cyan" title="Sovereign local runtime with zero outside AI dependencies">
            SOVEREIGN LOCAL RUNTIME
          </span>

          {!backendOnline ? (
            <span className="badge badge-failed">
              <span className="pulse-rose" />
              BACKEND OFFLINE
            </span>
          ) : modelProviderOnline ? (
            <span className="badge badge-verified" title="Local Ollama instance connected for live Qwen inference">
              <span className="pulse-emerald" />
              LIVE LOCAL INFERENCE
            </span>
          ) : (
            <span className="badge badge-cyan" title="Deterministic offline test & mission harness active">
              <span className="pulse-cyan" />
              DETERMINISTIC DEMO MODE
            </span>
          )}
        </div>


        {/* Security Persona Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              ROLE:
            </label>
            <select
              value={role}
              onChange={(e) => onChangeRole(e.target.value as Role)}
              style={{
                background: "var(--bg-surface-elevated)",
                border: "1px solid var(--bg-surface-border)",
                color: "var(--text-primary)",
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
              }}
            >
              <option value="VIEWER">VIEWER (Read-Only)</option>
              <option value="ENGINEER">ENGINEER (Standard Operations)</option>
              <option value="ADMINISTRATOR">ADMINISTRATOR (Full Clearance)</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              CLEARANCE:
            </label>
            <select
              value={clearance}
              onChange={(e) => onChangeClearance(e.target.value as DataClassification)}
              style={{
                background: "var(--bg-surface-elevated)",
                border: "1px solid var(--bg-surface-border)",
                color: "var(--text-primary)",
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
              }}
            >
              <option value="PUBLIC">PUBLIC</option>
              <option value="INTERNAL">INTERNAL</option>
              <option value="CONFIDENTIAL">CONFIDENTIAL</option>
              <option value="RESTRICTED">RESTRICTED</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{ display: "flex", gap: 2, padding: "0 20px" }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: isActive ? "2px solid var(--accent-cyan)" : "2px solid transparent",
                color: isActive ? "var(--accent-cyan)" : "var(--text-secondary)",
                padding: "10px 18px",
                fontSize: "0.82rem",
                fontFamily: "var(--font-mono)",
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s ease",
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                fontSize: "0.65rem",
                color: isActive ? "rgba(0,240,255,0.7)" : "var(--text-muted)",
                padding: "1px 5px",
                borderRadius: 3,
                background: isActive ? "rgba(0,240,255,0.12)" : "rgba(255,255,255,0.04)",
              }}>
                {tab.tag}
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
