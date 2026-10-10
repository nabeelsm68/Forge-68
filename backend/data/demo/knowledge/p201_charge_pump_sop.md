# SOP-P201: Standard Operating Procedure for Hydrocracker Feed Charge Pump P-201

## Document Metadata
- Document ID: SOP-P201-REV2
- Classification: INTERNAL
- Primary Standards: API 610 (11th Edition, BB2 Type), API 682 (Mechanical Seals)
- Tag Number: P-201A / P-201B (100% Duty / Standby)
- Service: Heavy Gas Oil / Slurry Feed Booster to R-204 Preheater Train
- Suction Pressure: 4.2 bar gauge
- Discharge Pressure: 42.0 bar gauge (Differential: 37.8 bar)
- Flow Rate: 185 m³/hr nominal

---

## 1. Operating Parameters & Monitoring Baseline

| Instrument Tag | Parameter | Normal Baseline | Alarm Trigger | Trip Threshold |
| :--- | :--- | :--- | :--- | :--- |
| **PI-201-DISC** | Pump Discharge Pressure | 41.5 – 43.0 bar | 46.0 bar | 48.0 bar |
| **FI-201-MIN** | Minimum Flow Recirculation | >= 45 m³/hr | < 40 m³/hr | < 30 m³/hr (Cavitation risk) |
| **VI-201-OB** | Outboard Bearing Vibration | 1.8 – 2.5 mm/s RMS | 4.5 mm/s RMS | 7.1 mm/s RMS (ISO 10816 Zone D) |
| **TI-201-BRG** | Thrust Bearing Metal Temp | 62°C – 74°C | 85°C | 95°C |
| **PDI-201-SEAL** | Seal Flush Barrier Pressure (Plan 53B)| 6.5 bar gauge | < 5.2 bar | < 4.8 bar (Loss of barrier) |

---

## 2. Startup Sequencing & Air-Free Priming
1. **Lube Oil System Check:** Verify oil reservoir level within bullseye sight glass; oil temperature between 25°C and 45°C.
2. **Seal Barrier System (API Plan 53B):** Confirm nitrogen bladder accumulator pressure is at 6.5 bar gauge (minimum 1.5 bar higher than seal chamber pressure).
3. **Suction Alignment:** Open suction block valve 100%. Never throttle suction valve to control pump throughput.
4. **Casing Venting:** Open high-point bleed needle valve until liquid stream is continuous and free of entrained gas or nitrogen bubbles.
5. **Motor Energization:** Start drive motor with discharge control valve FCV-201 cracked to 15% and minimum flow bypass valve open.
6. **Check Differential Pressure:** Verify discharge pressure reaches 42 bar within 8 seconds of startup.

---

## 3. Cavitation Detection & Remediation Protocol
If high-frequency cracking noises (sounding like pumping gravel) or vibration spike occurs:
- **Root Cause Check:** Insufficient Net Positive Suction Head Available (NPSHa < NPSHr), caused by fouled suction strainer S-201 or foaming in feed surge drum.
- **Immediate Action:**
  1. Check differential pressure transmitter PDI-201 across suction strainer. If Delta-P > 0.5 bar, switch to standby strainer or swap pumps.
  2. Increase liquid level in feed surge drum D-201 to maximize suction head.
  3. Increase minimum flow bypass to ensure impeller operates in preferred operating region (70% - 120% of Best Efficiency Point).
  4. If vibration exceeds 5.0 mm/s RMS, initiate emergency swap to standby pump P-201B.
