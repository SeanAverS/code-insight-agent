# Code Insight Agent

A dashboard designed for real-time file inspection and to visualize agent-assisted code refinements.

<video width="100%" autoplay loop muted playsinline>
  <source src="./gif_demo.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

---

## Table of Contents
* [Installation](#installation)
* [Usage](#usage)
* [Features](#features)

---
 
## Installation
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/SeanAverS/code-insight-agent.git
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd code-insight-agent
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Start the Bridge Server:**
    ```bash
    node index.js
    ```

---

## Usage
1.  **Request Context:** Ask the agent to read a file
2.  **Live Inspection:** The agent reads your file content and displays suggestions in the dashboard 
3.  **Confirm:** Press "Apply Changes" button to update your local file with these suggestions

---

## Features

* **Live File Difference:** Instant comparison between existing code and agent suggestions 
* **Agent Integration:** Direct pipeline for AI to push suggestions without manual copy pasting
