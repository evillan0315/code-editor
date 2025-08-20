# CodeGen Application

This repository contains the front-end application for a feature-rich code editor, built with React, TypeScript, and Tailwind CSS. It integrates various functionalities including a file explorer, CodeMirror editor, AI chat, terminal, and more.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Features](#features)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Installation

To get started with the project, clone the repository and install the dependencies:

```bash
git clone https://github.com/evillan0315/code-editor
cd code-editor
npm install
# or yarn install
```

## Usage

To run the application in development mode:

```bash
npm run dev
# or yarn dev
```

This will start the Vite development server, and you can access the application typically at `http://localhost:5173`.

To build the application for production:

```bash
npm run build
# or yarn build
```

## Project Structure

```
code-editor/
├── public/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── editor/     # Core editor UI components
│   │   └── ...
│   ├── constants/        # Application-wide constants
│   ├── contexts/         # React Contexts
│   ├── docs/             # Markdown documentation files
│   │   ├── editor/     # Documentation for editor components (NEW)
│   │   └── ...
│   ├── hooks/            # Custom React Hooks
│   ├── providers/        # React Context Providers
│   ├── routes/           # Application routes
│   ├── services/         # API services and utility functions
│   ├── stores/           # Nanostores for global state management
│   ├── styles/           # Tailwind CSS and global styles
│   ├── themes/           # CodeMirror themes
│   ├── types/            # TypeScript type definitions
│   └── utils/            # General utility functions
└── ...
```

## Features

- **Integrated Code Editor**: Powered by CodeMirror 6 with support for various languages, syntax highlighting, and extensions.
- **File Explorer**: Navigate, open, create, rename, and delete files and folders.
- **Tabbed Interface**: Manage multiple open files with an intuitive tab system.
- **AI Chat Integration**: Interact with AI models for code generation, explanation, and debugging.
- **Integrated Terminal**: Run shell commands directly within the editor.
- **Authentication**: User authentication system (e.g., GitHub, Google).
- **Theming**: Light and dark mode support.
- **Realtime Updates**: WebSocket integration for real-time file system events.

## Documentation

Comprehensive documentation for various parts of the application can be found in the `./src/docs` directory.

- [Editor Components Documentation](./src/docs/editor/index.md)
- [Audio to Text Features](./src/docs/audio-to-text.md)
- [Gemini Stream Integration](./src/docs/gemini-stream.md)
- [Resume Optimizer](./src/docs/resume.md)

## Contributing

We welcome contributions! Please see our `CONTRIBUTING.md` (if available) for guidelines.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.
