import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal, IDisposable } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { io, Socket } from "socket.io-client";

import { getTerminalTheme } from "@/themes/terminal";
import { useStore } from "@nanostores/react";
import { theme } from "@/stores/theme";

interface UseTerminalOptions {
  fontSize?: number;
  prompt?: string;
}

export function useTerminal(options: UseTerminalOptions) {
  const $theme = useStore(theme);

  const [terminalOpen, setTerminalOpen] = useState(false);
  const [term, setTerm] = useState<Terminal | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fitAddon = useRef(new FitAddon()).current;
  const currentContainer = useRef<HTMLDivElement | null>(null);
  const xtermDataDisposable = useRef<IDisposable | null>(null);

  const bufferRef = useRef("");
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  const pasteListener = useRef<((e: ClipboardEvent) => void) | null>(null);
  const copyListener = useRef<((e: ClipboardEvent) => void) | null>(null);

  const promptStr = options.prompt ?? "$";

  const printPrompt = useCallback(() => {
    term?.write(`\x1b[1;32m${promptStr}\x1b[0m `);
  }, [term]);

  const replaceLine = (line: string) => {
    if (!term) return;
    term.write(`\x1b[2K\r\x1b[1;32m${promptStr}\x1b[0m ${line}`);
    bufferRef.current = line;
  };

  const executeCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) {
      printPrompt();
      return;
    }

    if (socket?.connected) {
      socket.emit("exec", trimmedCmd);
    } else {
      term?.writeln(
        `\x1b[1;31m[ERROR]\x1b[0m Terminal not connected. Cannot execute: "${trimmedCmd}"`,
      );
      printPrompt();
    }
  };

  const handleKey = (key: string) => {
    if (!term) return;

    switch (key) {
      case "\r":
        term.write("\r\n");
        executeCommand(bufferRef.current);
        if (bufferRef.current.trim()) {
          commandHistoryRef.current.push(bufferRef.current.trim());
        }
        historyIndexRef.current = commandHistoryRef.current.length;
        bufferRef.current = "";
        break;
      case "\u007F":
        if (bufferRef.current.length > 0) {
          bufferRef.current = bufferRef.current.slice(0, -1);
          term.write("\b \b");
        }
        break;
      case "\u001b[A":
        if (historyIndexRef.current > 0) {
          historyIndexRef.current--;
          replaceLine(commandHistoryRef.current[historyIndexRef.current]);
        }
        break;
      case "\u001b[B":
        if (historyIndexRef.current < commandHistoryRef.current.length - 1) {
          historyIndexRef.current++;
          replaceLine(commandHistoryRef.current[historyIndexRef.current]);
        } else {
          historyIndexRef.current = commandHistoryRef.current.length;
          replaceLine("");
        }
        break;
      default:
        bufferRef.current += key;
        term.write(key);
    }
  };

  const initialize = (container: HTMLDivElement) => {
    if (term) {
      console.warn(
        "Terminal already initialized. Call dispose() first if re-initializing.",
      );
      return;
    }

    currentContainer.current = container;
    const storedThemeName = localStorage.getItem("theme") || $theme;
    const initialTerminalTheme = getTerminalTheme(storedThemeName);

    const t = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontFamily: "monospace",
      fontSize: options.fontSize ?? 14,
      theme: initialTerminalTheme,
      allowProposedApi: true,
    });

    t.loadAddon(fitAddon);
    t.open(container);
    fitAddon.fit();

    xtermDataDisposable.current = t.onData(handleKey);
    setTerm(t);

    const token = localStorage.getItem("token");
    const socketUrl = `${import.meta.env.VITE_WS_URL || window.location.origin}/terminal`;

    const s = io(socketUrl, {
      auth: { token: `Bearer ${token}` },
      transports: ["websocket", "polling"],
      //forceNew: true,
    });

    s.on("connect", () => {
      console.log("[✔] Terminal socket connected.");
      t.writeln("\x1b[1;32m[INFO]\x1b[0m Connected to terminal backend.");
      printPrompt();
    });

    s.on("output", (msg: string) => {
      t.writeln(msg);
      printPrompt();
    });

    s.on("outputInfo", (msg: { cwd: string }) => {
      t.writeln(
        `\x1b[1;36m[INFO]\x1b[0m Current working directory: ${msg.cwd}`,
      );
    });

    s.on("error", (err: string) => {
      t.writeln(`\x1b[1;31m[ERROR]\x1b[0m ${err}`);
      printPrompt();
    });

    s.on("disconnect", (reason: Socket.DisconnectReason) => {
      console.log(`[✖] Terminal socket disconnected: ${reason}`);
      t.writeln(`\x1b[1;33m[WARN]\x1b[0m Terminal disconnected (${reason}).`);
    });

    s.on("connect_error", (err: Error) => {
      console.error(`[✖] Terminal socket connection error:`, err);
      t.writeln(
        `\x1b[1;31m[CRITICAL ERROR]\x1b[0m Failed to connect: ${err.message}`,
      );
    });

    setSocket(s);

    pasteListener.current = (e) => {
      e.preventDefault();
      const text = e.clipboardData?.getData("text/plain");
      if (text) {
        t.write(text);
        bufferRef.current += text;
      }
    };

    copyListener.current = (e) => {
      const selection = t.getSelection();
      if (selection) {
        e.preventDefault();
        e.clipboardData?.setData("text/plain", selection);
      }
    };

    container.addEventListener("paste", pasteListener.current);
    container.addEventListener("copy", copyListener.current);

    printPrompt();
  };

  const handleResize = () => {
    fitAddon.fit();
  };

  const toggleTerminal = () => setTerminalOpen((prev) => !prev);

  const dispose = () => {
    socket?.disconnect();
    setSocket(null);

    term?.dispose();
    xtermDataDisposable.current?.dispose();
    setTerm(null);

    const container = currentContainer.current;
    if (container && pasteListener.current && copyListener.current) {
      container.removeEventListener("paste", pasteListener.current);
      container.removeEventListener("copy", copyListener.current);
    }

    pasteListener.current = null;
    copyListener.current = null;
    currentContainer.current = null;

    bufferRef.current = "";
    commandHistoryRef.current = [];
    historyIndexRef.current = -1;
  };

  useEffect(() => {
    if (!term) return;
    const newTheme = getTerminalTheme($theme);
    term.options.theme = newTheme;
    term.refresh(0, term.rows - 1);
  }, [$theme, term]);

  useEffect(() => {
    return () => {
      dispose();
    };
  }, []);

  return {
    term,
    socket,
    initialize,
    handleResize,
    toggleTerminal,
    terminalOpen,
    dispose,
  };
}
