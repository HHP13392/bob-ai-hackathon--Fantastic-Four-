# Architecture

## System Architecture

[GridGuard follows an edge-to-cloud architecture. The important safety operations happen directly on the ESP32-S3, while cloud services are used for monitoring, storage, analytics and AI. This means that a loss of Internet connectivity does not prevent the local safety relay from opera]

```mermaid
                 ┌──────────────────────────┐
                 │       POWER LOAD         │
                 │  Home / Electrical Load  │
                 └────────────┬─────────────┘
                              │
                    Voltage / Current
                              │
                 ┌────────────▼─────────────┐
                 │      SENSOR LAYER        │
                 │  ZMPT101B + ACS712       │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │       ESP32-S3            │
                 │  • Data Sampling          │
                 │  • RMS Calculation        │
                 │  • Edge ML Inference      │
                 │  • Fault Detection        │
                 └───────┬───────────┬──────┘
                         │           │
                Fault    │           │ Telemetry
                         ▼           ▼
                ┌────────────┐   ┌──────────────┐
                │   RELAY    │   │ MQTT BROKER  │
                │  Cut-off   │   │  Secure Data │
                └────────────┘   └──────┬───────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │ Flask Backend    │
                              │ • REST API       │
                              │ • Data Processing│
                              │ • Energy Calc.   │
                              └───────┬──────────┘
                                      │
                       ┌──────────────┼──────────────┐
                       ▼              ▼              ▼
                ┌────────────┐ ┌────────────┐ ┌─────────────┐
                │   SQLite   │ │ AI Engine  │ │ Dashboard   │
                │  Database  │ │ Gemini API  │ │ Chart.js    │
                └────────────┘ └──────┬─────┘ └─────────────┘
                                      │
                                      ▼
                               ┌─────────────┐
                               │  Telegram   │
                               │   Alerts &  │
                               │   Reports   │
                               └─────────────┘
```

## Components

| Component | Technology | Responsibility |
| Component                | Technology / Hardware         | Function                                                               |
| ------------------------ | ----------------------------- | ---------------------------------------------------------------------- |
| **Voltage Sensor**       | ZMPT101B                      | Measures AC voltage from the electrical circuit                        |
| **Current Sensor**       | ACS712                        | Measures current flowing through the load                              |
| **Microcontroller**      | ESP32-S3                      | Collects sensor data and performs local processing                     |
| **Edge ML Model**        | TensorFlow Lite               | Classifies electrical conditions such as normal, overload and spike    |
| **Safety Relay**         | 5V Relay                      | Disconnects the electrical load when a dangerous condition is detected |
| **MQTT Broker**          | HiveMQ MQTT                   | Transfers telemetry between the ESP32 and backend                      |
| **Backend Server**       | Python + Flask                | Processes incoming data and provides REST APIs                         |
| **Database**             | SQLite                        | Stores sensor readings, energy data and fault logs                     |
| **Cloud Infrastructure** | Google Cloud / Compute Engine | Hosts the backend application                                          |
| **Containerization**     | Docker / Docker Compose       | Packages and deploys backend services                                  |
| **Web Dashboard**        | HTML, CSS, JavaScript         | Provides real-time monitoring interface                                |
| **Charts**               | Chart.js                      | Displays real-time and historical energy data                          |
| **AI Energy Auditor**    | Google Gemini API             | Analyzes historical energy and fault data                              |
| **Data Visualization**   | Matplotlib                    | Generates analytical energy reports/charts                             |
| **Notification System**  | Telegram Bot API              | Sends AI reports and important alerts                                  |
| **AI Chat Assistant**    | Gemini + Backend              | Answers questions using the user's energy data                         |

## Data Flow

┌───────────────┐
│ Electrical    │
│ Load          │
└───────┬───────┘
        │
        ▼
┌────────────────┐
│ Voltage Sensor │
│ ZMPT101B       │
└───────┬────────┘
        │
        │
        ▼
┌────────────────┐
│ Current Sensor │
│ ACS712         │
└───────┬────────┘
        │
        ▼
┌─────────────────────────┐
│       ESP32-S3          │
│                         │
│ Sensor Processing       │
│ RMS Calculation         │
│ Power Calculation       │
│ ML Classification       │
└───────────┬─────────────┘
            │
            ▼
      ┌───────────┐
      │ Decision  │
      └─────┬─────┘
            │
       ┌────┴─────┐
       │          │
     NORMAL      FAULT
       │          │
       │          ▼
       │     ┌─────────┐
       │     │  Relay  │
       │     │  OFF    │
       │     └─────────┘
       │
       ▼
┌─────────────────┐
│ MQTT Broker     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Flask Backend   │
└────────┬────────┘
         │
    ┌────┼───────────┐
    │    │           │
    ▼    ▼           ▼
 SQLite Dashboard  Gemini AI
    │    │           │
    │    │           ▼
    │    │       AI Report
    │    │           │
    │    │           ▼
    │    │       Telegram
    │    │
    ▼    ▼
Historical
Analytics




| Step   | Data Flow                 | Description                                                                                    |
| ------ | ------------------------- | ---------------------------------------------------------------------------------------------- |
| **1**  | Electrical Load → Sensors | Electrical voltage and current are measured from the connected load.                           |
| **2**  | Sensors → ESP32-S3        | Analog sensor signals are collected by the ESP32-S3.                                           |
| **3**  | ESP32-S3 → Processing     | The ESP32 calculates electrical parameters such as RMS voltage, current and power.             |
| **4**  | Processing → ML Model     | Electrical measurements are given to the TensorFlow Lite model.                                |
| **5**  | ML Model → Decision       | The model identifies the operating condition, such as normal, overload or spike.               |
| **6**  | Decision → Relay          | If a dangerous condition is confirmed, the relay disconnects the electrical load.              |
| **7**  | ESP32 → MQTT              | Telemetry is packaged and published through MQTT.                                              |
| **8**  | MQTT → Flask              | The backend receives the telemetry from the MQTT broker.                                       |
| **9**  | Flask → SQLite            | Measurements and fault information are stored in the database.                                 |
| **10** | SQLite → Dashboard        | Historical and real-time information is displayed on the web dashboard.                        |
| **11** | SQLite → Gemini           | Historical energy/fault data can be sent to Gemini for AI analysis.                            |
| **12** | Gemini → User             | AI-generated analysis/reports are presented to the user and can be delivered through Telegram. |


## Security Considerations

| Security Area              | Security Consideration                                      | Proposed Protection                                                         |
| -------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Device Security**        | ESP32 could be physically tampered with                     | Secure firmware, restricted physical access and secure boot                 |
| **Communication Security** | Sensor data could be intercepted                            | Use **MQTT over TLS** rather than unencrypted MQTT                          |
| **Authentication**         | Unauthorized devices could publish data                     | Use device authentication and unique credentials/certificates               |
| **API Security**           | Unauthorized users could access backend APIs                | API authentication, authorization and rate limiting                         |
| **Database Security**      | Energy/fault history could be modified or stolen            | Restrict database access and use encrypted backups                          |
| **Cloud Security**         | Backend server could be attacked                            | Firewall, private networking, minimal exposed ports and regular updates     |
| **AI Security**            | Sensitive household data is sent to an external AI service  | Send only required data and avoid unnecessary personal information          |
| **Input Validation**       | Malicious MQTT/API data could reach backend                 | Validate and sanitize all incoming data                                     |
| **Access Control**         | Unauthorized dashboard access                               | User authentication and role-based access control                           |
| **Firmware Security**      | Malicious firmware could compromise the device              | Signed firmware and secure OTA update mechanism                             |
| **Relay Safety**           | Software failure could leave a dangerous load connected     | Hardware-level fail-safe protection and independent electrical protection   |
| **Availability**           | Internet/cloud failure should not disable electrical safety | Keep fault detection and relay control locally on ESP32                     |
| **Logging**                | Security incidents need investigation                       | Maintain timestamped device, authentication and fault logs                  |
| **Secrets Management**     | API/MQTT credentials could be exposed                       | Store secrets in environment variables/secret manager, never hard-code them |
| **Backup & Recovery**      | Database loss could remove historical data                  | Automated backups and recovery procedures                                   |

## Scalability Notes

[Optional: how would this scale beyond the hackathon prototype?]

[e.g., "The FastAPI backend is stateless and could be horizontally scaled behind a load balancer. The watsonx.ai calls are the bottleneck and would benefit from request batching."]
