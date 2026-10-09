"use client";

import React, { useState, useRef, useEffect } from "react";
import { DataClassification, Role } from "@/lib/api";
import { ComputedRuntimeState } from "@/lib/runtime";
import { ROLE_PERMISSIONS } from "@/lib/permissions";
import { useTranslation } from "@/lib/i18n";

export type ShellDestination = "missions" | "library" | "governance" | "audit" | "boundary";

export interface HeaderProps {
  activeDestination: ShellDestination;
  onSelectDestination: (dest: ShellDestination) => void;
  role: Role;
  onChangeRole: (r: Role) => void;
  clearance: DataClassification;
  onChangeClearance: (c: DataClassification) => void;
  runtime: ComputedRuntimeState;
  onOpenVoice?: () => void;
}

export function Header({
  activeDestination,
  onSelectDestination,
  role,
  onChangeRole,
  clearance,
  onChangeClearance,
  runtime,
  onOpenVoice,
}: HeaderProps) {
  const { language, setLanguage, t } = useTranslation();
  const [personaOpen, setPersonaOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const navItems: Array<{ id: ShellDestination; label: string }> = [
    { id: "missions", label: t("navMissions") },
    { id: "library", label: t("navKnowledge") },
    { id: "governance", label: t("navGovernance") },
    { id: "audit", label: t("navAudit") },
    { id: "boundary", label: t("navBoundary") },
  ];

  // Underline slide position
  const [underlineStyle, setUnderlineStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const buttonRefs = useRef<Map<ShellDestination, HTMLButtonElement>>(new Map());

  const handleRoleSelect = (newRole: Role) => {
    onChangeRole(newRole);
    const def = ROLE_PERMISSIONS[newRole];
    if (def) {
      onChangeClearance(def.defaultClearance);
    }
    setToastMessage(`${t("navContextUpdated")} ${newRole} (${def?.defaultClearance || clearance})`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
    setPersonaOpen(false);
  };

  useEffect(() => {
    const activeBtn = buttonRefs.current.get(activeDestination);
    const container = navContainerRef.current;
    if (activeBtn && container) {
      const btnRect = activeBtn.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setUnderlineStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [activeDestination, language]);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setPersonaOpen(false);
      }
    }
    if (personaOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [personaOpen]);

  const isOnline = runtime.backend === "ONLINE";

  return (
    <header
      style={{
        backgroundColor: "var(--bg-0)",
        borderBottom: "1px solid var(--line)",
        height: 64,
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
      }}
      className="forge-top-bar"
    >
      {/* Left: Product Identity & Navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 600,
              fontSize: "17px",
              letterSpacing: "0.2em",
              color: "var(--ink)",
              cursor: "pointer",
            }}
            onClick={() => onSelectDestination("missions")}
          >
            FORGE
          </span>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "12px",
              color: "var(--ink-3)",
              display: "none",
            }}
            className="md-show-inline"
          >
            Industrial AI Control Plane
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav
          ref={navContainerRef}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
          className="desktop-nav"
        >
          {navItems.map((item) => {
            const isActive = activeDestination === item.id;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  if (el) buttonRefs.current.set(item.id, el);
                  else buttonRefs.current.delete(item.id);
                }}
                onClick={() => onSelectDestination(item.id)}
                style={{
                  background: "none",
                  border: "none",
                  fontFamily: "var(--font-ui)",
                  fontSize: "14px",
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? "var(--ink)" : "var(--ink-2)",
                  cursor: "pointer",
                  padding: "6px 2px",
                  transition: "color var(--dur-fast) var(--ease-out)",
                }}
              >
                {item.label}
              </button>
            );
          })}

          {/* Sliding brass underline */}
          <div
            style={{
              position: "absolute",
              bottom: -4,
              height: 1.5,
              backgroundColor: "var(--brass)",
              left: underlineStyle.left,
              width: underlineStyle.width,
              transition: "left 260ms var(--ease-out), width 260ms var(--ease-out)",
              pointerEvents: "none",
            }}
          />
        </nav>
      </div>

      {/* Right Controls: Boundary Chip, Language Selector, Voice, & Persona */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Boundary Chip */}
        <button
          onClick={() => onSelectDestination("boundary")}
          title="Inspect sovereignty boundary and runtime verification"
          style={{
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-pill)",
            padding: "5px 12px",
            fontFamily: "var(--font-ui)",
            fontSize: "12px",
            color: "var(--ink)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            transition: "border-color var(--dur-fast) var(--ease-out)",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: isOnline ? "var(--sage)" : "var(--coral)",
              boxShadow: isOnline ? "0 0 6px var(--sage)" : "0 0 6px var(--coral)",
            }}
          />
          <span>{isOnline ? t("navLocalOnly") : t("navOffline")}</span>
        </button>

        {/* Global Language Selector (EN / HI / KN) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-pill)",
            padding: "2px 5px",
          }}
          title="Switch application language (English / Hindi / Kannada)"
        >
          {(["en", "hi", "kn"] as const).map((lng) => {
            const isSelected = language === lng;
            return (
              <button
                key={lng}
                type="button"
                onClick={() => setLanguage(lng)}
                style={{
                  background: isSelected ? "var(--brass)" : "transparent",
                  color: isSelected ? "#000" : "var(--ink-2)",
                  border: "none",
                  borderRadius: "var(--radius-pill)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  fontWeight: isSelected ? 700 : 500,
                  padding: "3px 8px",
                  cursor: "pointer",
                  transition: "all var(--dur-fast) var(--ease-out)",
                }}
              >
                {lng.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Persistent Voice Assistant Trigger */}
        <button
          onClick={onOpenVoice}
          title="Open sovereign local voice assistant"
          style={{
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-pill)",
            padding: "5px 12px",
            fontFamily: "var(--font-ui)",
            fontSize: "12px",
            color: "var(--ink)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            transition: "border-color var(--dur-fast) var(--ease-out)",
          }}
        >
          <span>🎙</span>
          <span>{t("navVoiceButton")}</span>
        </button>

        {/* Demo Persona Selector */}
        <div style={{ position: "relative" }} ref={popoverRef}>
          <button
            onClick={() => setPersonaOpen(!personaOpen)}
            style={{
              background: "var(--bg-1)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-pill)",
              padding: "5px 14px",
              fontFamily: "var(--font-ui)",
              fontSize: "12px",
              color: "var(--ink)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <span style={{ color: "var(--ink-3)" }}>{t("navPersona")}:</span>
            <span style={{ fontWeight: 500 }}>{role}</span>
            <span style={{ color: "var(--line-strong)" }}>·</span>
            <span style={{ color: "var(--brass)" }}>{clearance}</span>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 1L5 5L9 1" />
            </svg>
          </button>

          {/* Demo Persona Popover */}
          {personaOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: 360,
                backgroundColor: "var(--bg-2)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-panel)",
                boxShadow: "var(--shadow-popover)",
                padding: "18px",
                zIndex: 200,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 500, color: "var(--ink)" }}>
                    {t("navPersonaSelectTitle")}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--sage)" }}>
                    {t("navRbacBadge")}
                  </span>
                </div>
                <div style={{ fontFamily: "var(--font-ui)", fontSize: "12px", color: "var(--ink-2)", marginTop: 4 }}>
                  {t("navRbacExplanation")}
                </div>
              </div>

              {/* 1-Click Role Selection Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
                {(["ENGINEER", "INSPECTOR", "AI_OPERATOR", "ADMIN", "SECURITY_OFFICER"] as Role[]).map((r) => {
                  const cfg = ROLE_PERMISSIONS[r];
                  const isCurrent = role === r;
                  return (
                    <div
                      key={r}
                      onClick={() => handleRoleSelect(r)}
                      style={{
                        background: isCurrent ? "var(--bg-3)" : "var(--bg-0)",
                        border: isCurrent ? "1px solid var(--brass)" : "1px solid var(--line)",
                        borderRadius: "var(--radius-sm)",
                        padding: "10px 12px",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        transition: "all var(--dur-fast) var(--ease-out)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: "var(--font-ui)", fontSize: "13px", fontWeight: 600, color: isCurrent ? "var(--brass)" : "var(--ink)" }}>
                            {cfg.label}
                          </span>
                          {isCurrent && (
                            <span style={{ fontSize: "10px", color: "var(--sage)", fontFamily: "var(--font-mono)" }}>
                              ✓ ACTIVE
                            </span>
                          )}
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--ink-3)", border: "1px solid var(--line)", padding: "1px 5px", borderRadius: "var(--radius-pill)" }}>
                          {cfg.defaultClearance}
                        </span>
                      </div>

                      <p style={{ fontFamily: "var(--font-ui)", fontSize: "11.5px", color: "var(--ink-2)", lineHeight: 1.35, margin: 0 }}>
                        {cfg.summary}
                      </p>

                      <div style={{ display: "flex", gap: 10, fontSize: "10.5px", fontFamily: "var(--font-mono)", color: "var(--ink-3)", marginTop: 2 }}>
                        <span>Read: <strong style={{ color: "var(--sage)" }}>✓</strong></span>
                        <span>Investigate: <strong style={{ color: "var(--sage)" }}>✓</strong></span>
                        <span>Actuate: <strong style={{ color: cfg.actuate === "ALLOWED" ? "var(--sage)" : cfg.actuate === "NEEDS_APPROVAL" ? "var(--brass)" : "var(--coral-text)" }}>
                          {cfg.actuate === "ALLOWED" ? "✓" : cfg.actuate === "NEEDS_APPROVAL" ? "⚠ Req. Approval" : "✕ Blocked"}
                        </strong></span>
                        <span>Admin: <strong style={{ color: cfg.admin === "ALLOWED" ? "var(--sage)" : "var(--mist)" }}>
                          {cfg.admin === "ALLOWED" ? "✓" : "✕"}
                        </strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Clearance override toggle */}
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
                  Clearance Override:
                </span>
                <select
                  value={clearance}
                  onChange={(e) => {
                    const c = e.target.value as DataClassification;
                    onChangeClearance(c);
                    setToastMessage(`Clearance updated: ${role} now operating at ${c}`);
                    setTimeout(() => setToastMessage(null), 4000);
                  }}
                  style={{
                    background: "var(--bg-1)",
                    border: "1px solid var(--line-strong)",
                    color: "var(--brass)",
                    padding: "3px 8px",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
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
          )}
        </div>

        {/* Access Context Updated Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: "fixed",
              top: 72,
              right: 24,
              backgroundColor: "var(--bg-2)",
              border: "1px solid var(--brass)",
              borderRadius: "var(--radius-panel)",
              boxShadow: "var(--shadow-popover)",
              padding: "10px 16px",
              zIndex: 300,
              display: "flex",
              alignItems: "center",
              gap: 12,
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            <span style={{ color: "var(--sage)", fontSize: "14px" }}>✓</span>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "13px", color: "var(--ink)", fontWeight: 500 }}>
              {toastMessage}
            </span>
            <button
              onClick={() => setToastMessage(null)}
              style={{ background: "none", border: "none", color: "var(--ink-3)", cursor: "pointer", fontSize: "12px", marginLeft: 8 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            background: "none",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-sm)",
            color: "var(--ink)",
            padding: "6px 10px",
            cursor: "pointer",
            display: "none",
          }}
          className="mobile-menu-btn"
          aria-label="Toggle navigation menu"
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.8">
            <line x1="0" y1="1" x2="18" y2="1" />
            <line x1="0" y1="7" x2="18" y2="7" />
            <line x1="0" y1="13" x2="18" y2="13" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        @media (max-width: 860px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
        @media (min-width: 600px) {
          .md-show-inline {
            display: inline !important;
          }
        }
      `}</style>
    </header>
  );
}
