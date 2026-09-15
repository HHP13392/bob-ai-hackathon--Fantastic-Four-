# Solution Overview

## What We Built

GridGuard is an AI-ready predictive maintenance command center that transforms grid sensor and weather data into prioritized operational decisions, helping utility teams prevent failures and improve grid reliability.

## How It Works

step:1 - Collect data - GridGuard receives data from grid assets such as substations and transformers.

step:2 - Check the data - It validates the sensor and asset information.

Step:3 - Analyze asset condition - It checks temperature, vibration, weather exposure, and recent trends.

Step:4 - Calculate risk score - The system combines these factors to calculate a risk score for each asset.

Step:5 - Classify the asset - Each asset is marked as:
         1. Critical
        2. High
        3. Medium
        4. Low
        
Step:6 - Show the results - The dashboard displays the most important information for the operator.

Step:7 - Identify priority assets - GridGuard highlights the assets that need attention first.

Step:8 - Recommend an action - It suggests actions such as inspecting equipment or sending a maintenance crew.

Step:9 - Prevent failures - The maintenance team acts early to reduce outages, equipment damage, and emergency repairs.


## Architecture Diagram

> See [`architecture.md`](architecture.md) for the detailed diagram.

<img width="3120" height="612" alt="image" src="https://github.com/user-attachments/assets/a01be585-936a-4d8e-b397-e1b732a76802" />


```
[User] → [Frontend: React] → [API: FastAPI] → [watsonx.ai] → [Dashboard]
                                    ↓
                             [PostgreSQL DB]
```

## Key Design Decisions

| Decision | Rationale |
|---|---|
|Centralized command-center dashboard| Gives operators one clear view and reduces response time.|
| Risk classification system | Makes complex asset data simple and prioritizes urgent problems.|
| Maintenance recommendations | Converts analysis into practical preventive action.
 |

## IBM Technologies Used
- TECHNOLOGY1: IBM watsonx.ai - IBM watsonx.ai can analyze asset data such as temperature, vibration, weather exposure, and historical trends. It helps generate risk explanations and maintenance recommendations.
  
- TECHNOLOGY2: IBM Event Streams - IBM Event Streams can receive continuous data from grid sensors and weather services, such as temperature, vibration, equipment status, and alerts.
