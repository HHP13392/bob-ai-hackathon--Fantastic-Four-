# 🚀 [Your Project Title Here]

> ⚠️ **Replace everything in `[ ]` brackets with your actual content before submission.**

---

## 👥 Team

| Field | Value |
|---|---|
| **Team Name** | [Nexus Four] |
| **Track** | [AI / DevOps / Sustainability / Open] |
| **Team Lead** | [Het Patel] — [26ce063@charusat.edu.in] |
| **Members** | [Dweeja Shingala], [Briva Vachhani], [Yug Vasani] |

---

## 🎯 Problem Statement

> In 2–3 sentences: What problem does your project solve? Who experiences this problem?

 Power transformer and substation failures cause blackouts costing utilities $1M+/hour and affecting millions of people. 
   Most utilities still rely on calendar-based maintenance schedules, even though sensors already measuring temperature, vibration, partial discharge, and oil quality show failure signatures weeks in advance. 
   Weather events compound the risk, but sensor data and weather forecasts are never combined in time to act.
---

## 💡 Solution

> In 2–3 sentences: What did you build? How does it solve the problem above?

 Shift utilities from reactive/calendar-based maintenance to a predictive, risk-ranked maintenance and response system.

---

## ✨ Key Features

- *Real-Time Edge Safety — ESP32-S3 samples voltage/current 50x/sec; on-device TFLite ML model classifies faults (normal/overload/spike); relay cuts power in ~340ms; works completely offline
Live Cloud Dashboard — Glassmorphism UI showing live voltage, current, power graphs, 7-day usage history, and estimated bill in ₹
AI Energy Auditor — Google Gemini Pro API analyzes historical sensor data and delivers detailed energy reports via Telegram (Senior Energy Analyst persona)
AI Chat Assistant — Embedded chat interface grounded in real sensor data; answers user questions with context-aware responses                             

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | [ [C++ (firmware), Python (backend/ML), HTML, CSS, JavaScript] |
| **Frameworks** | [Flask (backend), Keras (ML training), TensorFlow Lite (edge inference), Chart.js (frontend), PlatformIO (firmware toolchain)]   |
| **IBM Technologies** | [None used — project uses Google technologies (Gemini Pro API, Google Compute Engine)]     |
| **Databases** | [[SQLite]  |
| **Other** | [ESP32-S3 microcontroller, ZMPT101B voltage sensor, ACS712 current sensor, 5V safety relay, MQTT (HiveMQ broker), Docker, Docker Compose, Telegram Bot API, REST API, Glassmorphism design system]  |

---

## 📁 Repository Structure

```
├── src/                  # All source code
├── docs/                 # Written documentation
│   ├── problem-statement.md
│   ├── solution-overview.md
│   ├── architecture.md
│   └── setup-guide.md
├── demo/                 # Demo artifacts
│   ├── screenshots/      # App screenshots
│   └── demo-video-link.txt  # Link to demo video
├── presentation/         # Slide deck
└── submission.yaml       # Structured submission metadata
```

---

## ⚡ How to Run

> **Copy these exact steps from your [`docs/setup-guide.md`](docs/setup-guide.md)**

```bash
# 1. Clone the repo
git clone https://github.com/[your-repo].git
cd [your-repo]

# 2. Install dependencies
[your install command here]

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Run the project
[your run command here]
```

---

## 🖥️ Demo

| Artifact | Link |
|---|---|
| 📹 Demo Video | [See demo/demo-video-link.txt](demo/demo-video-link.txt) |
| 🌐 Live Demo | [See demo/live-demo-url.txt](demo/live-demo-url.txt) |
| 🖼️ Screenshots | [See demo/screenshots/](demo/screenshots/) |
| 📊 Presentation | [See presentation/slides.pdf](presentation/) |

---

## ⚠️ Known Limitations

> Be honest — judges appreciate transparency over overclaiming.

- [Limitation 1: e.g., "Authentication is mocked — not production-ready"]
- [Limitation 2: e.g., "Only tested on Chrome"]
- [Limitation 3: e.g., "Feature X is scaffolded but not fully implemented"]

---

## 🏅 What We're Most Proud Of

[Tell the judges what part of your submission is strongest and worth paying close attention to.]

---
