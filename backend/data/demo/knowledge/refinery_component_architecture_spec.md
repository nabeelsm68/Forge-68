# SPEC-ARCH-204: Engineering Architecture, Component Blueprints & Code Compliance Spec

## Document Metadata
- Document ID: SPEC-ARCH-204-REV5
- Classification: INTERNAL
- Primary Standards: ASME Section VIII Div 1, ASME B16.5, ASME B31.3, API 510, NACE MR0175
- Equipment: Hydrocracker Reactor Vessel R-204 & Associated Piping Manifold
- Date of Base Engineering: 2024-03-15
- Engineering Contractor: Sovereign Industrial Plant Design Group

---

## 1. Vessel Architectural Envelope & Materials of Construction

| Parameter | Specification | ASME Code Clause / Standard Reference |
| :--- | :--- | :--- |
| **Inside Diameter (ID)** | 2,800 mm | ASME Sec VIII Div 1 Appendix 1 |
| **Overall Tangent Height** | 18,500 mm | Base Vessel Elevation Profile |
| **Head Geometry** | 2:1 Semi-Ellipsoidal Heads (Top & Bottom) | ASME Sec VIII Div 1 UG-32(d) |
| **Base Shell Material** | SA-387 Grade 22 Class 2 (2.25Cr-1Mo alloy steel) | ASME Section II Part A |
| **Internal Cladding** | 3.0 mm SS 347 weld overlay (Stabilized austenitic) | API 582 High Temperature Corrosion Barrier |
| **Design Pressure (MAWP)** | 35.0 bar gauge (3.50 MPa) at 440°C | ASME Sec VIII Div 1 UG-21 |
| **Design Temperature** | 440°C (Internal fluid design max) | ASME Sec VIII Div 1 UG-20 |
| **Nominal Shell Thickness** | 75.0 mm fabricated base metal | Ultrasonic Baseline Verified |
| **Minimum Required Thickness (t_min)** | 68.2 mm calculated under design pressure | ASME Sec VIII Div 1 UG-27(c)(1) |
| **Corrosion Allowance (CA)** | 3.0 mm minimum required for sour service | NACE MR0175 / API 510 Clause 7.1 |

---

## 2. Nozzle Architecture, Flange Class & Reinforcement Schedule

| Nozzle Tag | Service Description | Size / Schedule | Flange Rating | Reinforcement Calc | Status / Compliance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **N1** | Top Hydrocracker Feed Inlet | 12" Sch 160 (300 mm) | Class 300 RTJ (ASME B16.5) | UG-37 Integral forging | COMPLIANT |
| **N2** | Bottom Effluent Discharge Nozzle | 14" Sch 160 (350 mm) | Class 300 RTJ (ASME B16.5) | UG-37 Reinforcement Pad | COMPLIANT (Min weld throat: 11.2 mm) |
| **N3** | Quench Gas Injection (x4 ports) | 4" Sch XXS (100 mm) | Class 600 RTJ (ASME B16.5) | Heavy wall insert nozzle | COMPLIANT |
| **N4** | Relief Valve Nozzle to PSV-204 | 6" Sch 160 (150 mm) | Class 300 RTJ (ASME B16.5) | Full penetration butt-weld | COMPLIANT |
| **M1** | Top Inspection Manway | 24" ID Self-Reinforced | Class 300 Flat Face | ASME Sec VIII UG-36 | COMPLIANT |

### Critical Architectural Rule: Flange Rating Class Validation
- Under ASME B16.5 Group 1.9 materials at 425°C - 440°C:
  - **Class 150 Flanges** have a Maximum Allowable Working Pressure of only **19.6 bar gauge**. Using Class 150 components anywhere on R-204 (which operates at 31.2–35.0 bar) is a **CRITICAL SAFETY VIOLATION**.
  - **Class 300 Flanges** provide a Maximum Allowable Working Pressure of **49.6 bar gauge** at 425°C, providing proper safety margin over the 35.0 bar MAWP.
  - Any engineering drawing or P&ID specifying Class 150 on R-204 nozzle connections must be **REJECTED AND FLAGGED IMMEDIATELY**.

---

## 3. Structural Weld Acceptance Criteria & NDT Verification
- **Circumferential & Longitudinal Seams:** Category A & B joints must undergo 100% Phased Array Ultrasonic Testing (PAUT) per ASME Section V Article 4.
- **Weld Overlay Bonding:** 100% ultrasonic examination for disbonding per ASTM A578 Level B.
- **Acceptance Limit for Cracks/Incomplete Penetration:** Zero allowable (rejection threshold per ASME Section VIII Div 1 UW-51).
