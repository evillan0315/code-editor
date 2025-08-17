# 🚀 CodeGen - Web-based Code Editor

A responsive and highly customizable web-based code editor built with React, Vite, and CodeMirror. This project aims to provide a modern, in-browser IDE experience with features like a flexible panel layout, integrated terminal, file management, and AI assistance. Fully compatible NestJS API powered server.

## ✨ Features

- **Customizable Layout:** Resizable sidebars (left and right) and a resizable bottom terminal panel for a personalized workspace. Panel dimensions are persisted across sessions.
- **Tabbed File Management:** Open multiple files in a tabbed interface, easily switch between them, and close individual or all tabs.
- **Integrated Code Editor:** Powered by CodeMirror 6, offering:
  - Syntax highlighting for various languages (JavaScript, HTML, CSS, JSON, Markdown, Python, SQL, XML, YAML).
  - Basic autocompletion and linting.
  - Theme support (One Dark).
- **Built-in Terminal:** An interactive terminal powered by Xterm.js for executing commands directly within the editor environment, **featuring command history navigation (up/down arrows) and persistence.**
- **AI Chat Panel:** Integration with Google GenAI for AI-powered assistance (e.g., code generation, explanations, debugging help) directly within the right sidebar.
- **File Picker:** An intuitive file browser to open existing files from the workspace.
- **Responsive UI:** Designed with Tailwind CSS for a clean and adaptive user interface.
- **Lightweight State Management:** Utilizes Nanostores for efficient and reactive global state management.
- **Persistent Settings:** Layout dimensions and potentially other user preferences are saved locally.

## 🛠️ Tech Stack

This project is built using a modern web development stack:

- **Frontend Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Code Editor Core:** [CodeMirror 6](https://codemirror.net/) (`@codemirror/*`, `@uiw/react-codemirror`)
- **Terminal Emulator:** [Xterm.js](https://xtermjs.org/) (`@xterm/xterm`)
- **State Management:** [Nanostores](https://nanostores.github.io/) (`nanostores`, `@nanostores/react`, `@nanostores/persistent`)
- **Routing:** [React Router DOM](https://reactrouter.com/en/main)
- **Icons:** [Iconify](https://icon-sets.iconify.design/) (`@iconify/react`), [Lucide React](https://lucide.dev/)
- **AI Integration:** [`@google/genai`](https://www.npmjs.com/package/@google/genai)
- **Utility Libraries:** `clsx`, `tailwind-merge`, `nanoid`, `uuid`, `qs`, `dompurify`, `framer-motion` (for animations), `socket.io-client` (for potential real-time features), `react-speech-recognition` (for voice input, if enabled), `react-query` (for data fetching, if used).
- **Markdown Rendering:** `marked`, `react-markdown`, `remark-gfm`, `react-syntax-highlighter`, `prismjs`.

## ⚙️ Installation

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (LTS version recommended)
- npm or Yarn or pnpm

### Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/code-editor.git
    cd code-editor
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    # or pnpm install
    ```

## 🚀 Usage

### Development

To run the project in development mode with hot-reloading:

```bash
npm run dev
# or yarn dev
# or pnpm dev
```

This will typically open the application at `http://localhost:5173` (or another available port).

### Building for Production

To build the application for production:

```bash
npm run build
# or yarn build
# or pnpm build
```

This will compile the project into the `dist` directory.

### Previewing the Production Build

To preview the production build locally:

```bash
npm run preview
# or yarn preview
# or pnpm preview
```

## 📜 Available Scripts

In the project directory, you can run:

- `npm run dev`: Starts the development server with Vite.
- `npm run build`: Compiles the project for production, generating optimized static assets.
- `npm run lint`: Runs ESLint to check for code quality and potential errors.
- `npm run lint:fix`: Runs ESLint and automatically fixes fixable issues in the codebase.
- `npm run preview`: Serves the production build locally to test how it will behave in a deployed environment.
- `npm run format`: Formats TypeScript and TSX files in the `src` directory using Prettier to ensure consistent code style.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also open an issue with the tag 'enhancement'.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**(Optional: Add Screenshots/GIFs Here)**
_Consider adding screenshots or a short GIF of the editor in action to showcase its features directly in the README._
