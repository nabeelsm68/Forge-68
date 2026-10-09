"use client";

import React from "react";
import { DataClassification, Role } from "@/lib/api";
import { ComputedRuntimeState } from "@/lib/runtime";
import { Header, ShellDestination } from "./Header";
import { RuntimeFooter } from "./RuntimeFooter";

export interface AppShellProps {
  activeDestination: ShellDestination;
  onSelectDestination: (dest: ShellDestination) => void;
  role: Role;
  onChangeRole: (r: Role) => void;
  clearance: DataClassification;
  onChangeClearance: (c: DataClassification) => void;
  runtime: ComputedRuntimeState;
  onRefreshRuntime?: () => void;
  onOpenVoice?: () => void;
  children: React.ReactNode;
}

export function AppShell({
  activeDestination,
  onSelectDestination,
  role,
  onChangeRole,
  clearance,
  onChangeClearance,
  runtime,
  onRefreshRuntime,
  onOpenVoice,
  children,
}: AppShellProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-0)",
        color: "var(--ink)",
      }}
      className="forge-app-shell"
    >
      {/* 1. Header (64px) */}
      <Header
        activeDestination={activeDestination}
        onSelectDestination={onSelectDestination}
        role={role}
        onChangeRole={onChangeRole}
        clearance={clearance}
        onChangeClearance={onChangeClearance}
        runtime={runtime}
        onOpenVoice={onOpenVoice}
      />

      {/* 2. Main Work Area (1360px max width, centered) */}
      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 1360,
          margin: "0 auto",
          padding: "36px 32px 64px",
        }}
        className="forge-main-content"
      >
        {children}
      </main>

      {/* 3. Runtime Truth Footer (36px fixed) */}
      <RuntimeFooter runtime={runtime} onRefresh={onRefreshRuntime} />

      <style jsx>{`
        @media (max-width: 780px) {
          .forge-main-content {
            padding: 20px 16px 56px !important;
          }
        }
      `}</style>
    </div>
  );
}
