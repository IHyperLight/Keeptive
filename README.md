# 🟢 Keeptive - Discreet Window Interaction Tool

📌 Keeptive is a Python-based Windows automation tool designed to interact with the windows on your system by simulating user actions such as clicks and mouse movements discreetly and without interrupting your activity. 

📌 The script can handle one or multiple windows simultaneously, manage their states (minimized or restored) to ensure they receive the interaction, and even keep your entire PC awake for as long as you choose. 

📌 It also offers options to pause based on a window focus, select the on-screen location for some activation modes, define the interval between interactions, and run for a set duration or indefinitely.

![Keeptive UI](https://github.com/user-attachments/assets/386f89c1-a7a8-4842-bd06-1c6fa95d1631)

## 🩷 Features

- **⚡ Four Automated Modes for Different Situations: Clicking, Movement, Passive, and Key**: Simulates four types of interaction with target windows or the entire system, as appropriate.

- **🚥 Window State Management**: Handles minimized windows discreetly, restores them for interaction, and then positions them in the background without disrupting the user experience.

- **👀 Focus-Aware Activation**: Optional pause functionality to avoid interaction when the target window is already in the foreground.

- **📍 Screen Location Selector**: Optional functionality to select a specific location on the screen for click and mouse movement activation modes.

- **⌚ Customizable Timed Execution**: Run your activation or interaction task for a specified duration or continuously until manually stopped.

---

## ▶️ Getting Started

- **1.** Download the [latest release here](https://github.com/IHyperLight/Keeptive/releases/tag/v1.0.0).

- **2.** Unzip, open the folder and run the executable file (Keeptive.exe).

- **3.** Keep your windows active!

---

## ⚙️ Getting Started (Advanced)
### Prerequisites
Before you begin, make sure you have the following components installed:

- [Node.js](https://nodejs.org/en)
- [Git](https://git-scm.com/)
  
### Installation
Follow these steps to clone the repository and set up the project:

- **1.** Clone the repository:
  ```bash
  git clone https://github.com/IHyperLight/Keeptive.git
  ```
  
- **2.** Navigate to the project directory:
  ```bash
  cd Keeptive
  ```
  
- **3.** Install the necessary dependencies:
Use npm to install the project's dependencies.
  ```bash
  npm install
  ```

### Running the Project
To start the application in development mode, run the following command:
  ```bash
  npm start
  ```

### Building the Application
To create a distributable package, run:
  ```bash
  npm run build
  ```
The output will be located in the dist folder.

---

❗ *Due to the way Universal Windows Platform (UWP) applications handle and manage received events, certain activation modes and interactions aimed specifically at UWP windows may not function correctly. Similarly, there may be specific cases of suboptimal performance in other applications that, due to their nature or state, handle activation events in unique ways. Additionally, if you notice incorrect behavior in applications running in exclusive fullscreen mode, switching to borderless windowed mode should fix the issue.*

❗ *Keeptive aims to operate discreetly, enabling users to continue their tasks while it works in the background. Some similar programs, such as auto-clickers, can temporarily alter how the operating system manages windows. If you find Keeptive bringing windows to the foreground or disrupting your activities, restarting your PC should restore normal window management, which may have been altered by another application. This will allow Keeptive to function quietly again.*
