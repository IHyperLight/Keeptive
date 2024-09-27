# 🟢 Keeptive - Automated Window Interaction Tool

📌 Keeptive is a Python-based Windows automation tool designed to interact with the windows on your system by simulating user actions such as clicks and mouse movements to keep them active. 

📌 The script can handle one or multiple windows simultaneously, manage their states (minimized or restored) to ensure they receive the interaction, and even keep your PC awake for as long as you choose. 

📌 It also offers options to pause based on window focus, select the on-screen location for some activation modes, define the interval between interactions, and run for a set duration or indefinitely.

![Keeptive UI](https://drive.google.com/uc?export=view&id=1tiZbpRRwd0IjGuKZDPAsWFSDCxQQ0Mts)

## 🩷 Features

- **⚡ Four Automated Activation Modes for Different Situations: Clicking, Movement, Passive, and Key**: Simulates four types of interaction with target windows or the entire system, as appropriate.

- **🚥 Window State Management**: Handles minimized windows, restores them for interaction, and then positions them discreetly in the background without disrupting the user experience.

- **⏸️ Focus-Aware Activation**: Optional pause functionality to avoid interaction when the target window is already in the foreground.

- **📍 Screen Location Selector**: Optional functionality to select a specific location on the screen for click and mouse movement activation modes.

- **⌚ Customizable Timed Execution**: Run tasks for a specified duration or continuously until manually stopped.
---
❗ *Due to the way Universal Windows Platform (UWP) applications handle and manage received events, certain activation modes and interactions aimed specifically at UWP windows may not function correctly. Similarly, there may be specific cases of suboptimal performance in other applications that, due to their nature, handle activation events in unique ways.*
