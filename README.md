<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# StyleVision — AI Fashion Mirror

StyleVision is a revolutionary, real-time AI fashion assistant that transforms your device into an intelligent mirror. By leveraging the power of Google's Gemini Multimodal Live API, StyleVision provides a conversational, hands-free experience for exploring fashion and visualizing new looks instantly.

## 🚀 The Problem it Solves

Choosing the right outfit can be time-consuming and often requires physical experimentation. StyleVision eliminates this friction by:
- **Instant Visualization**: Allowing users to see themselves in new outfits without physically changing.
- **Expert Guidance**: Providing a conversational AI stylist that can offer real-time feedback and suggestions based on what it "sees" through the camera.
- **Creative Exploration**: Enabling users to experiment with styles they might not own or haven't considered, all through simple voice commands.

## ✨ Key Features

- **Real-Time Multimodal Interaction**: Talk to your AI stylist naturally. It sees your current outfit and responds with vocal feedback and styling advice.
- **Voice-Activated Outfit Generation**: Simply say "Imagine me in a red leather jacket" or "What if I wore a formal tuxedo?", and StyleVision generates a photorealistic image of you in that outfit, maintaining your pose and background.
- **Slideshow & History**: Review all the looks generated during your session in a beautiful slideshow or download them to your device.
- **Seamless UX**: Minimalist, full-screen interface designed for a "mirror" feel, featuring an interactive audio visualizer and intuitive controls.

## 🛠️ Technical Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Models**:
  - **Google Gemini Multimodal Live API**: For real-time voice and vision interaction.
  - **Gemini 2.0 Flash (Imagen-powered)**: For high-fidelity, consistent outfit generation.
- **Media Handling**: WebRTC (Camera/Mic Access), Web Audio API (PCM Processing).

## 📂 Project Structure

```text
├── components/          # UI Components (Modals, Visualizer, etc.)
├── services/            # Core business logic and API integrations
│   ├── liveService.ts   # Gemini Multimodal Live API management
│   └── imageGenService.ts # Outfit generation logic
├── utils/               # Helper functions for audio/image processing
├── App.tsx              # Main application entry and state management
├── constants.ts         # Configuration, model names, and system prompts
├── types.ts             # TypeScript interface definitions
└── vite.config.ts       # Vite configuration with env mapping
```

## ⚙️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- A Google Gemini API Key (available via [Google AI Studio](https://aistudio.google.com/))

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd stylevision-ai-mirror
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env.local` file in the root directory and add your API key:
    ```env
    GEMINI_API_KEY=your_actual_api_key_here
    ```

4.  **Run the application**:
    ```bash
    npm run dev
    ```
    Open `http://localhost:3000` in your browser (default port is 3000 as per `vite.config.ts`).

## 💡 Usage

1.  **Start the Mirror**: Click the "Play" button to grant camera and microphone access.
2.  **Talk to StyleVision**: Greet the AI and ask for styling advice.
3.  **Request an Outfit**: Say "Imagine me in..." followed by any clothing description.
4.  **Review & Save**: Use voice commands or the UI to view your slideshow or download your favorite looks.

---

Created with 💖 by [Akshat Bindal](https://akshatbindal.cc.cc)
