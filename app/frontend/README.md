# Ladli Frontend

A modern React frontend application built with Vite and TypeScript.

## Features

- ⚡ **Vite** - Next generation frontend tooling
- ⚛️ **React 18** - Latest React features
- 🎯 **TypeScript** - Type-safe development
- 🎨 **Modern CSS** - Beautiful styling
- 🚀 **Optimized Builds** - Production-ready

## Prerequisites

- Node.js 16+ 
- npm or yarn

## Installation

```bash
# Install dependencies
npm install
```

## Development

```bash
# Start development server
npm run dev
```

The application will open at `http://localhost:3000`

## Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── public/           # Static assets
│   └── index.html   # HTML entry point
├── src/
│   ├── components/  # React components
│   │   ├── Header.tsx
│   │   ├── Header.css
│   │   ├── Footer.tsx
│   │   └── Footer.css
│   ├── pages/       # Page components
│   ├── App.tsx      # Root component
│   ├── App.css      # App styles
│   ├── main.tsx     # React entry point
│   └── index.css    # Global styles
├── vite.config.ts   # Vite configuration
├── tsconfig.json    # TypeScript configuration
└── package.json     # Dependencies
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

MIT
