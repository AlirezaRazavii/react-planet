# Procedural Mini-Planet

A beautiful 3D procedural planet generator built with React, Three.js, and custom GLSL shaders. Features dynamic terrain generation, animated clouds, orbiting moon, and interactive controls.

## Features

- 🌍 Procedural planet generation using custom noise shaders
- 🌊 Dynamic ocean level simulation with real-time updates
- ☁️ Animated cloud layer with procedural textures
- 🌙 Orbiting moon with trailing path visualization
- ⭐ Shooting stars with random trajectories
- 🪐 Saturn-like ring system (toggleable)
- 🎮 Interactive orbit controls for camera manipulation
- 🌅 Day/night cycle with atmospheric lighting

## How to Run This Project

### Prerequisites

Make sure you have the following installed on your system:
- Node.js (version 16 or higher)
- npm (comes with Node.js)

### Step-by-Step Instructions

1. **Clone or download the project**
   ```bash
   # If you have the project files, navigate to the project directory
   cd procedural-mini-planet
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   This will install all required packages including:
   - React and React DOM
   - @react-three/fiber (React renderer for Three.js)
   - @react-three/drei (Three.js helpers)
   - Three.js (3D graphics library)
   - Tailwind CSS (for styling)
   - TypeScript and Vite (development tools)

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - The development server will start and display a local URL (usually `http://localhost:5173`)
   - Open this URL in your web browser
   - You should see the 3D procedural planet scene

### Controls

- **Mouse**: Click and drag to rotate the camera around the planet
- **Mouse Wheel**: Scroll to zoom in and out
- **Click anywhere**: Toggle the planet's ring system on/off
- **Toggle Ring Button**: Use the button in the top-left panel to toggle rings

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

To preview the production build:

```bash
npm run preview
```

### Troubleshooting

If you encounter any issues:

1. **Dependencies not found**: Make sure you ran `npm install` successfully
2. **Port already in use**: The dev server will automatically use a different port if 5173 is busy
3. **Browser compatibility**: This project uses WebGL and modern JavaScript features. Use a recent version of Chrome, Firefox, Safari, or Edge

### Technology Stack

- **React 18** - UI framework
- **Three.js** - 3D graphics library
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Three.js helpers and abstractions
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Custom GLSL Shaders** - Procedural terrain and effects

### Project Structure

```
src/
├── App.tsx          # Main application component with 3D scene
├── main.tsx         # React app entry point
├── index.css        # Global styles and Tailwind imports
└── vite-env.d.ts    # TypeScript environment definitions
```

Enjoy exploring your procedural mini-planet! 🚀