# Keeptive - Auto Clicker & Discreet Window Interaction Tool

<div align="center">

[![Download Keeptive](https://img.shields.io/badge/Download-Keeptive%20v1.2.0-brightgreen?style=for-the-badge&logo=github&logoColor=white)](https://github.com/IHyperLight/Keeptive/releases/tag/v1.2.0)

</div>

## 🟢 Overview

-   📌 Keeptive is a Windows automation tool built with Electron and Python, designed to keep windows active by simulating user interactions such as clicks, movements, key presses, and passive signals, all discreetly and without interrupting your workflow.

-   📌 The application can handle multiple windows simultaneously, manage their states (minimized or restored) to ensure proper interaction, and offers system-wide activation to keep your entire PC awake for as long as needed.

-   📌 Advanced features include customizable toggle shortcuts for instant start/stop control, system tray integration for background operation, auto-pause when windows are in foreground, precise location picking for click/movement actions, configurable intervals and durations, and the ability to combine multiple activation modes simultaneously for maximum flexibility.

![Keeptive UI](https://github.com/user-attachments/assets/bd8b0919-c011-4001-8bff-9c92f000c1cc)

---

## 🩷 Features

-   **⚡ Multiple Activation Modes**: Four powerful modes that can work independently or simultaneously. Click (simulates mouse clicks), Move (simulates mouse movement), Passive (sends activation signals), and Key Press (simulates keyboard input). Combine multiple modes for enhanced effectiveness.

-   **🎯 System-Wide & Window Specific Targeting**: Choose between targeting specific windows or keeping your entire system awake with system-wide mode. Search and select from all open windows with icon previews for easy identification.

-   **⌨️ Global Toggle Shortcuts**: Configure custom keyboard shortcuts (F1-F12 directly, or Ctrl+ combinations) to start/stop activation instantly from anywhere, even when the app is minimized to tray. Supports multiple shortcuts simultaneously.

-   **🔔 System Tray Integration**: Minimize to system tray to keep the app running discreetly in the background. Quick access menu shows activation status with visual indicators (ON/OFF) and provides instant control without opening the main window.

-   **🚥 Intelligent Window Management**: Automatically handles minimized windows by restoring them for interaction and repositioning them in the background without disrupting your workflow. Smart state management ensures seamless operation.

-   **👀 Auto Pause on Focus**: Optional pause functionality that automatically stops activation when the target window is already in the foreground, preventing unnecessary interactions and saving resources.

-   **📍 Precision Location Picker**: Interactive crosshair tool to select exact screen coordinates for click and movement modes. When disabled, defaults to window center or current cursor position (system-wide mode).

-   **⏱️ Flexible Timing Controls**: Fully customizable intervals (in seconds) between actions, optional duration limits (in minutes) or run indefinitely, and adjustable hold time (in milliseconds) for mouse button presses in system-wide mode.

---

## ▶️ Getting Started

-   **1.** Download the [latest release here](https://github.com/IHyperLight/Keeptive/releases/tag/v1.2.0).

-   **2.** Unzip, open the folder and run the executable (Keeptive.exe).

-   **3.** Keep your windows discreetly active :)

---

## ⚙️ Getting Started (Advanced)

-   ### Prerequisites

    Before you begin, make sure you have the following components installed:

    -   [Node.js](https://nodejs.org/en)
    -   [Git](https://git-scm.com/)

-   ### Installation

    Follow these steps to clone the repository and set up the project:

    -   **1.** Clone the repository:
        ```bash
        git clone https://github.com/IHyperLight/Keeptive.git
        ```
    -   **2.** Navigate to the project directory:
        ```bash
        cd Keeptive
        ```
    -   **3.** Install the necessary dependencies:
        Use npm to install the project's dependencies.
        ```bash
        npm install
        ```

-   ### Running the Project
    To start the application in development mode, run the following command:
    ```bash
    npm start
    ```
-   ### Building the Application
    To create a distributable package, run:
    ```bash
    npm run build
    ```
    The output will be located in the dist folder.

---

## ✔️ How To Use

![Keeptive 1](https://github.com/user-attachments/assets/a997986e-dd8e-41fc-baf6-b7f20446f4da)
![Keeptive 2](https://github.com/user-attachments/assets/c397d2a4-6ec4-43cb-899c-b0d3b4f7eff7)
![Keeptive 3](https://github.com/user-attachments/assets/103c39d8-6815-4132-8cbf-be6a0254a90b)
![Keeptive 4](https://github.com/user-attachments/assets/fe3b9b12-17ff-45bc-ac55-23d9fda596f5)

---

## ⚠️ Considerations

-   ❗ _Due to the way Universal Windows Platform (UWP) applications handle and manage received events, certain activation modes and interactions aimed specifically at UWP windows may not function correctly. Similarly, there may be specific cases of suboptimal performance in other applications that, due to their nature or state, handle activation events in unique ways. Additionally, if you notice incorrect behavior in applications running in exclusive fullscreen mode, switching to borderless windowed mode should fix the issue._

-   ❗ _Keeptive aims to operate discreetly, enabling users to continue their tasks while it works in the background. Some similar programs, such as auto-clickers, can temporarily alter how the operating system manages windows. If you find Keeptive bringing windows to the foreground or disrupting your activities, restarting your PC should restore normal window management, which may have been altered by another application. This will allow Keeptive to function quietly again._

---

## 💕 For you

-   I sincerely hope that my tool proves useful to you in one way or another. Feel free to share any feedback to help improve Keeptive. Thank you :)

---

## ⌨️ Valid Keys for Key Press Mode and Start/Stop

| Key                 | Description             |
| ------------------- | ----------------------- |
| `\t`                | Tab                     |
| `\n`                | Line Feed (LF)          |
| `\r`                | Carriage Return (Enter) |
| `!`                 | Shift + 1               |
| `"`                 | Shift + '               |
| `#`                 | Shift + 3               |
| `$`                 | Shift + 4               |
| `%`                 | Shift + 5               |
| `&`                 | Shift + 7               |
| `'`                 | Apostrophe              |
| `(`                 | Shift + 9               |
| `)`                 | Shift + 0               |
| `*`                 | Shift + 8               |
| `+`                 | Shift + =               |
| `,`                 | Comma                   |
| `-`                 | Hyphen                  |
| `.`                 | Period                  |
| `/`                 | Slash                   |
| `0`                 | 0                       |
| `1`                 | 1                       |
| `2`                 | 2                       |
| `3`                 | 3                       |
| `4`                 | 4                       |
| `5`                 | 5                       |
| `6`                 | 6                       |
| `7`                 | 7                       |
| `8`                 | 8                       |
| `9`                 | 9                       |
| `:`                 | Shift + ;               |
| `;`                 | Semicolon               |
| `<`                 | Shift + ,               |
| `=`                 | Equals                  |
| `>`                 | Shift + .               |
| `?`                 | Shift + /               |
| `@`                 | Shift + 2               |
| `[`                 | Open Bracket            |
| `\\`                | Backslash               |
| `]`                 | Close Bracket           |
| `^`                 | Shift + 6               |
| `_`                 | Shift + Hyphen          |
| `` ` ``             | Grave Accent            |
| `a`                 | a                       |
| `b`                 | b                       |
| `c`                 | c                       |
| `d`                 | d                       |
| `e`                 | e                       |
| `f`                 | f                       |
| `g`                 | g                       |
| `h`                 | h                       |
| `i`                 | i                       |
| `j`                 | j                       |
| `k`                 | k                       |
| `l`                 | l                       |
| `m`                 | m                       |
| `n`                 | n                       |
| `o`                 | o                       |
| `p`                 | p                       |
| `q`                 | q                       |
| `r`                 | r                       |
| `s`                 | s                       |
| `t`                 | t                       |
| `u`                 | u                       |
| `v`                 | v                       |
| `w`                 | w                       |
| `x`                 | x                       |
| `y`                 | y                       |
| `z`                 | z                       |
| `{`                 | Shift + [               |
| `\|`                | Shift + Backslash       |
| `}`                 | Shift + ]               |
| `~`                 | Shift + `               |
| `accept`            | IME Accept              |
| `add`               | Numpad +                |
| `alt`               | Alt                     |
| `altleft`           | Left Alt                |
| `altright`          | Right Alt               |
| `apps`              | Applications key        |
| `backspace`         | Backspace               |
| `browserback`       | Browser Back            |
| `browserfavorites`  | Browser Favorites       |
| `browserforward`    | Browser Forward         |
| `browserhome`       | Browser Home            |
| `browserrefresh`    | Browser Refresh         |
| `browsersearch`     | Browser Search          |
| `browserstop`       | Browser Stop            |
| `capslock`          | Caps Lock               |
| `clear`             | Clear                   |
| `convert`           | IME Convert             |
| `ctrl`              | Ctrl                    |
| `ctrlleft`          | Left Ctrl               |
| `ctrlright`         | Right Ctrl              |
| `decimal`           | Decimal point           |
| `del`               | Delete                  |
| `delete`            | Delete                  |
| `divide`            | Numpad /                |
| `down`              | Down Arrow              |
| `end`               | End                     |
| `enter`             | Enter                   |
| `esc`               | Escape                  |
| `escape`            | Escape                  |
| `execute`           | Execute                 |
| `f1`                | F1                      |
| `f10`               | F10                     |
| `f11`               | F11                     |
| `f12`               | F12                     |
| `f13`               | F13                     |
| `f14`               | F14                     |
| `f15`               | F15                     |
| `f16`               | F16                     |
| `f17`               | F17                     |
| `f18`               | F18                     |
| `f19`               | F19                     |
| `f2`                | F2                      |
| `f20`               | F20                     |
| `f21`               | F21                     |
| `f22`               | F22                     |
| `f23`               | F23                     |
| `f24`               | F24                     |
| `f3`                | F3                      |
| `f4`                | F4                      |
| `f5`                | F5                      |
| `f6`                | F6                      |
| `f7`                | F7                      |
| `f8`                | F8                      |
| `f9`                | F9                      |
| `final`             | IME Final               |
| `hanguel`           | Hanguel                 |
| `hangul`            | Hangul                  |
| `hanja`             | Hanja                   |
| `help`              | Help                    |
| `home`              | Home                    |
| `insert`            | Insert                  |
| `junja`             | Junja                   |
| `kana`              | Kana                    |
| `kanji`             | Kanji                   |
| `launchapp1`        | Launch App 1            |
| `launchapp2`        | Launch App 2            |
| `launchmail`        | Launch Mail             |
| `launchmediaselect` | Launch Media Select     |
| `left`              | Left Arrow              |
| `modechange`        | Mode Change             |
| `multiply`          | Numpad \*               |
| `nexttrack`         | Next Track              |
| `nonconvert`        | IME Nonconvert          |
| `num0`              | Numpad 0                |
| `num1`              | Numpad 1                |
| `num2`              | Numpad 2                |
| `num3`              | Numpad 3                |
| `num4`              | Numpad 4                |
| `num5`              | Numpad 5                |
| `num6`              | Numpad 6                |
| `num7`              | Numpad 7                |
| `num8`              | Numpad 8                |
| `num9`              | Numpad 9                |
| `numlock`           | Num Lock                |
| `pagedown`          | Page Down               |
| `pageup`            | Page Up                 |
| `pause`             | Pause                   |
| `pgdn`              | Page Down               |
| `pgup`              | Page Up                 |
| `playpause`         | Play/Pause              |
| `prevtrack`         | Previous Track          |
| `print`             | Print                   |
| `printscreen`       | Print Screen            |
| `prntscrn`          | Print Screen            |
| `prtsc`             | Print Screen            |
| `prtscr`            | Print Screen            |
| `return`            | Enter (Return)          |
| `right`             | Right Arrow             |
| `scrolllock`        | Scroll Lock             |
| `select`            | Select                  |
| `separator`         | Separator               |
| `shift`             | Shift                   |
| `shiftleft`         | Left Shift              |
| `shiftright`        | Right Shift             |
| `sleep`             | Sleep                   |
| `space`             | Space                   |
| `stop`              | Stop                    |
| `subtract`          | Numpad -                |
| `tab`               | Tab                     |
| `up`                | Up Arrow                |
| `volumedown`        | Volume Down             |
| `volumemute`        | Volume Mute             |
| `volumeup`          | Volume Up               |
| `win`               | Windows Key             |
| `winleft`           | Left Windows Key        |
| `winright`          | Right Windows Key       |
| `yen`               | Yen                     |
| `win`               | Windows Key             |
| `winleft`           | Left Windows Key        |
| `winright`          | Right Windows Key       |
| `yen`               | Yen                     |

---

## ⚖️ Disclaimer

Keeptive is designed for lawful and ethical use only.

Users are fully responsible for their use of the software and must ensure compliance with all applicable laws and platform policies. By using Keeptive, you agree to these terms.
