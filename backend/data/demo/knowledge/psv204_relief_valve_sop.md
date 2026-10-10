# SOP-PSV-204: Testing, Inspection & Recertification of Safety Relief Valve PSV-204

## Document Metadata
- Document ID: SOP-PSV-204-REV3
- Classification: RESTRICTED
- Governing Standards: ASME Section VIII Div 1 (UG-125 through UG-136), API 520, API 526, API 576
- Tag Number: PSV-204
- Protected Equipment: Reactor R-204
- Set Pressure: 35.0 bar gauge (MAWP)
- Orifice Designation: 1.5J2 (API 526 Standard)
- Relieving Capacity: 142,500 kg/hr hydrocarbon vapor

---

## 1. Safety Relief Valve Philosophy & Integrity
PSV-204 is the primary overpressure protection device protecting hydrocracker vessel R-204 against structural rupture. 
Under ASME Section VIII Div 1 UG-125, no block valve in the relief path may be closed while the reactor is pressurized unless an engineered, locked-open car-seal protocol (CSO) is verified.

---

## 2. Pre-Commissioning & Pop-Test Verification Procedure

Before vessel startup or following turnaround overhaul:
1. **Bench Test Pop Pressure:**
   - Mount PSV-204 on the certified offline air/nitrogen test bench.
   - Slowly increase test pressure at <= 0.1 bar/sec.
   - Pop pressure must trigger between 34.65 bar and 35.35 bar (within +/- 1.0% tolerance under ASME Section VIII).
   - Record cold differential test pressure (CDTP) compensating for 425°C operating temperature and backpressure.

2. **Seat Tightness Leak Test (API 527):**
   - Apply test pressure to 90% of set pressure (31.5 bar gauge).
   - Check weep rate with bubble tube apparatus. Max allowable leakage: <= 20 bubbles/minute for 1-minute test duration.

3. **Car-Seal Lock-Open Protocol (CSO):**
   - Inlet block valve 204-BV-01 and discharge isolation valve 204-BV-02 must be locked open with stainless steel tamper-evident car seals.
   - Seals are numbered (Seal #CS-204-098) and logged in the DCS safety interlock registry.

---

## 3. In-Service Visual & Ultrasonic Inspection Routine
- **Weekly Weep Hole Check:** Ensure relief tailpipe atmospheric drain is clear and not plugged by ice or wax buildup.
- **Rupture Disk Tell-Tale Gauge:** Check intermediate pressure gauge PI-204-RD between rupture disk and PSV. Reading must strictly indicate 0.0 bar gauge (zero backpressure). Any non-zero reading indicates disk pinhole or failure.
- **Vibration & Chatter Survey:** During elevated operating pressure (> 32.5 bar), monitor for valve simmer or disk chatter which can cause galling of the stellite seating surfaces.
