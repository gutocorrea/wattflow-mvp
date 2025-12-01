# Bike Power Meter SaaS - Implementation Plan

## Overview
A Progressive Web App (PWA) SaaS that estimates bike power output based on user and bike data.

## Core Features
1.  **User Profile & Bike Configuration**
    *   Input: Rider Weight, Height.
    *   Input: Bike Type (Road, MTB, etc.), Crank Arm Length.
    *   Storage: LocalStorage for MVP (easy persistence without backend for now).

2.  **Power Estimation Engine**
    *   Algorithm to calculate estimated power based on available sensors (e.g., speed, cadence from phone sensors or manual input) and physics models (rolling resistance, air resistance, gravity).
    *   *Note: Without actual strain gauges, this is an estimation.*

3.  **Dashboard**
    *   Real-time display of estimated power.
    *   Historical data (Implemented).
    *   **Charts & Analysis**: Session details with power graph (Implemented).
    *   **Export**: CSV Export for Strava/TrainingPeaks (Implemented).

4.  **PWA Features**
    *   Offline capability (Implemented).
    *   Installable on mobile devices (Implemented).

5.  **Advanced Features**
    *   **Theme**: Light/Dark Mode (Implemented).
    *   **Connectivity**: SensorManager structure for Web Bluetooth (Prepared).
    *   **Workout Mode**: Structured intervals with target power (Implemented).
    *   **Custom Workouts**: JSON-based workout creator (Implemented).
    *   **Audio Feedback**: Beeps for interval changes and countdowns (Implemented).

## Tech Stack
*   **Frontend**: HTML5, Vanilla JavaScript.
*   **Styling**: Vanilla CSS (Premium, dark mode aesthetics).
*   **Build Tool**: Vite (configured manually via package.json if needed, or simple static serving).

## Step-by-Step Implementation
1.  **Project Initialization**: Create file structure.
2.  **Design System**: Setup `style.css` with variables for colors, typography (Inter/Roboto).
3.  **UI Implementation**:
    *   Landing/Login Screen.
    *   Setup Wizard (Profile/Bike data).
    *   Main Dashboard.
4.  **Logic Implementation**:
    *   State management for user data (Done).
    *   Power calculation function (Done - Physics Engine Implemented).
5.  **PWA Integration**: Add `manifest.json` and `sw.js` (Done).
