# SOP-INT-204: Junior Engineer & Intern Field Operations Guide for Reactor R-204

## Document Metadata
- Document ID: SOP-INT-204-REV1
- Classification: INTERNAL
- Equipment: R-204, PSV-204, PI-204, TI-204, P-201
- Version: 1.0
- Target Audience: Process Engineering Interns & Junior Field Operators
- Facility: Sovereign Synthetic Refinery Unit 2

---

## 1. Safety Briefing & Zero-Bypass Protocol
All junior engineers and interns assigned to Unit 2 must observe strict procedural compliance. 
Under no circumstances may automated safety trips, pressure relief valves, or emergency depressuring loops be bypassed or overridden.

### Mandatory PPE Requirements
1. Class 2 Flame-Resistant Clothing (FRC)
2. Four-gas personal atmospheric monitor (H2S, LEL, CO, O2)
3. Hard hat with safety glasses and hearing protection (NRR >= 28 dB)
4. Steel-toe composite dielectric boots

---

## 2. Daily Shift Rounds & Walkdown Checklist (Every 2 Hours)

| Tag ID | Component Description | Normal Operating Range | Alarm Threshold | Escalation Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **PI-204** | R-204 Reactor Shell Discharge Pressure | 30.5 – 31.5 bar gauge | 33.5 bar gauge | >= 34.0 bar (Notify Lead Engineer) |
| **TI-204** | Catalyst Bed 1 Center Temperature | 395°C – 410°C | 415°C | Delta-T > 25°C/hr |
| **P-201** | Feed Booster Pump Casing Vibration | < 2.8 mm/s RMS | 4.5 mm/s RMS | Cavitation noise or seal leak |
| **PSV-204** | Primary Spring-Loaded Safety Relief Valve | Zero leakage / Car-Seal Open | Pop test at 35.0 bar | Weep hole venting or frosting |

---

## 3. Step-by-Step Response to Elevated Discharge Pressure (PI-204 > 32.5 bar)

If discharge pressure PI-204 rises above 32.5 bar during your shift:
1. **Verify Instrument Redundancy:** Cross-check analog dial gauge PI-204 against DCS transmitter PT-204B to rule out single-sensor drift.
2. **Inspect Catalyst Bed Exotherm:** Check TI-204 and TI-205 for runaway exothermic temperature increases.
3. **Check Effluent Path:** Verify that downstream heat exchanger E-301 control valve HCV-301 is 100% open and not fouling.
4. **Hydrogen Quench Valve Verification:** Confirm quench valve QCV-204A is responding properly to DCS modulation.
5. **Immediate Escalation:** If pressure reaches 33.5 bar (Alarm limit), do NOT attempt manual venting without Senior DCS Console Engineer and Shift Superintendent authorization.

---

## 4. Emergency Depressurization (Blowdown) Protocol

In the event of an uncontrolled thermal excursion (> 440°C) or rapid overpressure (> 34.8 bar approaching trip at 35.0 bar):
1. **Trip Feed Booster Pump P-201** immediately from the local emergency trip push-button (HS-201-ESD).
2. **Activate Emergency Depressuring Valve (BDV-204):** Divert reactor inventory to the high-pressure flare header at maximum design blowdown rate.
3. **Sound Evacuation Siren:** Evacuate all personnel within a 150-meter perimeter of the hydrocracker unit.
4. **Log Event Sequence:** Record the exact timestamp, initial pressure, peak temperature, and blowdown completion time in the shift handover log.
