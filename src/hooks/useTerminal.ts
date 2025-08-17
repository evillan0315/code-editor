// src/hooks/useTerminal.ts
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Terminal, IDisposable } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { io, Socket } from "socket.io-client";
import { useStore } from "@nanostores/react";
import { API_URL } from "@/services/apiFetch";
import { getTerminalTheme } from "@/themes/terminal";
import { theme } from "@/stores/theme";
import { Theme } from "@/types/theme"; // Import your Theme type

interface UseTerminalOptions {
  fontSize?: number;
  prompt?: string;
}

export function useTerminal(options: UseTerminalOptions) {
  const $theme = useStore(theme) as Theme;

  const [terminalOpen, setTerminalOpen] = useState(false);
  const [term, setTerm] = useState<Terminal | null>(null); // Keep term as state
  const [socket, setSocket] = useState<Socket | null>(null);

  // bufferRef, commandHistoryRef, historyIndexRef don't need to trigger re-renders
  const bufferRef = useRef("");
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  // xtermDataDisposableRef will now be managed by its own useEffect
  const xtermDataDisposableRef = useRef<IDisposable | null>(null);

  const pasteListenerRef = useRef<
    ((this: HTMLDivElement, ev: ClipboardEvent) => any) | null
  >(null);
  const copyListenerRef = useRef<
    ((this: HTMLDivElement, ev: ClipboardEvent) => any) | null
  >(null);
  const currentContainerRef = useRef<HTMLDivElement | null>(null);

  const promptStr = options.prompt ?? "$";

  const fitAddon = useMemo(() => new FitAddon(), []);

  const printPrompt = useCallback(() => {
    // Access latest term via state
    term?.write(`\x1b[1;32m${promptStr}\x1b[0m `);
  }, [term, promptStr]); // term is a dependency

  const replaceLine = useCallback(
    (line: string) => {
      // Access latest term via state
      if (!term) return;
      term.write(`\x1b[2K\r\x1b[1;32m${promptStr}\x1b[0m ${line}`);
      bufferRef.current = line;
    },
    [term, promptStr], // term is a dependency
  );

  const executeCommand = useCallback(
    (cmd: string) => {
      // Access latest socket/term via state
      const s = socket;
      const t = term;
      const trimmedCmd = cmd.trim();

      if (!trimmedCmd) {
        printPrompt();
        return;
      }

      if (s && s.connected) {
        s.emit("exec", trimmedCmd);
      } else {
        t?.writeln(
          `\x1b[1;31m[ERROR]\x1b[0m Terminal not connected. Cannot execute: "${trimmedCmd}"`,
        );
        printPrompt();
      }
    },
    [socket, term, printPrompt], // term and socket are dependencies
  );

  const handleKey = useCallback(
    (key: string) => {
      // Access latest term via state
      const t = term;
      if (!t) return;

      switch (key) {
        case "\r":
          t.write("\r\n");
          executeCommand(bufferRef.current);
          if (bufferRef.current.trim().length > 0) {
            commandHistoryRef.current.push(bufferRef.current.trim());
          }
          historyIndexRef.current = commandHistoryRef.current.length;
          bufferRef.current = "";
          break;
        case "\u007F":
          if (bufferRef.current.length > 0) {
            bufferRef.current = bufferRef.current.slice(0, -1);
            t.write("\b \b");
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
          t.write(key);
      }
    },
    [term, executeCommand, replaceLine], // term, executeCommand, replaceLine are dependencies
  );

  // src/hooks/useTerminal.ts - Inside dispose function
  const dispose = useCallback(() => {
    // Socket cleanup
    if (socket) {
      socket.disconnect();
      // DO NOT setSocket(null) here for Strict Mode's sake
    }

    // Terminal cleanup
    if (term) {
      term.dispose();
      // DO NOT setTerm(null) here for Strict Mode's sake
    }

    // Remove paste/copy listeners
    if (
      currentContainerRef.current &&
      pasteListenerRef.current &&
      copyListenerRef.current
    ) {
      currentContainerRef.current.removeEventListener(
        "paste",
        pasteListenerRef.current,
      );
      currentContainerRef.current.removeEventListener(
        "copy",
        copyListenerRef.current,
      );
    }

    bufferRef.current = "";
    commandHistoryRef.current = [];
    historyIndexRef.current = -1;
    xtermDataDisposableRef.current = null;
    pasteListenerRef.current = null;
    copyListenerRef.current = null;
    currentContainerRef.current = null;
  }, [socket, term]); // Dependencies are still needed to get the latest socket/term to disconnect/dispose

  // This useEffect manages the onData listener lifecycle
  useEffect(() => {
    if (!term) {
      // If term is null, ensure any existing disposable is cleaned up
      if (xtermDataDisposableRef.current) {
        xtermDataDisposableRef.current.dispose();
        xtermDataDisposableRef.current = null;
      }
      return;
    }

    // If a term instance exists, create or update the onData listener
    // Dispose previous listener if it exists to avoid memory leaks/duplicate listeners
    if (xtermDataDisposableRef.current) {
      xtermDataDisposableRef.current.dispose();
      xtermDataDisposableRef.current = null;
    }

    // Subscribe to onData with the latest handleKey
    const disposable = term.onData(handleKey);
    xtermDataDisposableRef.current = disposable;

    // Cleanup function: This runs when term or handleKey changes, or when the component unmounts
    return () => {
      if (xtermDataDisposableRef.current) {
        // Check ref, not local `disposable`
        xtermDataDisposableRef.current.dispose();
        xtermDataDisposableRef.current = null;
      }
    };
  }, [term, handleKey]); // Dependencies: term (when it becomes non-null or changes), handleKey (when its dependencies change)

  const initialize = useCallback(
    (container: HTMLDivElement) => {
      // Only initialize if term is not already set
      if (term) {
        console.warn(
          "Terminal already initialized. Call dispose() first if re-initializing.",
        );
        return;
      }

      currentContainerRef.current = container;

      const initialTerminalTheme = getTerminalTheme($theme);

      const newTerm = new Terminal({
        cursorBlink: true,
        convertEol: true,
        fontFamily: "monospace",
        fontSize: options.fontSize ?? 14,
        theme: initialTerminalTheme,
        allowProposedApi: true,
      });

      newTerm.loadAddon(fitAddon);
      newTerm.open(container);
      fitAddon.fit();

      // IMPORTANT: DO NOT SUBSCRIBE ON DATA HERE ANYMORE.
      // The useEffect above will handle it once `setTerm(newTerm)` is called.
      setTerm(newTerm); // This will cause the useEffect for onData to run.

      const token = localStorage.getItem("token");
      const socketUrl = `${API_URL || window.location.origin}/terminal`;

      const newSocket = io(socketUrl, {
        auth: { token: `Bearer ${token}` },
        transports: ["websocket", "polling"],
        //forceNew: true,
      });

      // Socket event listeners
      newSocket.on("connect", () => {
        console.log("[✔] Terminal socket connected.");
        newTerm.writeln(
          "\x1b[1;32m[INFO]\x1b[0m Connected to terminal backend.",
        );
        printPrompt();
      });

      newSocket.on("output", (msg: string) => {
        newTerm.writeln(msg);
        printPrompt();
      });

      newSocket.on("outputInfo", (msg: { cwd: string }) => {
        newTerm.writeln(
          `\x1b[1;36m[INFO]\x1b[0m Current working directory: ${msg.cwd}`,
        );
      });

      newSocket.on("error", (err: string) => {
        newTerm.writeln(`\x1b[1;31m[ERROR]\x1b[0m ${err}`);
        printPrompt();
      });

      newSocket.on("disconnect", (reason: Socket.DisconnectReason) => {
        console.log(`[✖] Terminal socket disconnected: ${reason}`);
        newTerm.writeln(
          `\x1b[1;33m[WARN]\x1b[0m Terminal disconnected (${reason}). Commands will not be executed.`,
        );
      });

      newSocket.on("connect_error", (err: Error) => {
        console.error(`[✖] Terminal socket connection error:`, err);
        newTerm.writeln(
          `\x1b[1;31m[CRITICAL ERROR]\x1b[0m Failed to connect to terminal backend: ${err.message}`,
        );
      });

      setSocket(newSocket);

      // Paste/Copy listeners (these can remain here as they don't depend on `handleKey`'s changing identity)
      pasteListenerRef.current = (e) => {
        e.preventDefault();
        const text = e.clipboardData?.getData("text/plain");
        if (text) {
          newTerm.write(text);
          bufferRef.current += text;
        }
      };
      copyListenerRef.current = (e) => {
        const selection = newTerm.getSelection();
        if (selection) {
          e.preventDefault();
          e.clipboardData?.setData("text/plain", selection);
        }
      };

      container.addEventListener("paste", pasteListenerRef.current);
      container.addEventListener("copy", copyListenerRef.current);

      printPrompt();
    },
    [
      term, // Still a dependency for the `if (term)` check
      $theme,
      fitAddon,
      options.fontSize,
      printPrompt,
    ],
    // handleKey is explicitly NOT a dependency here anymore, it's handled by its own useEffect
  );

  const toggleTerminal = useCallback(
    () => setTerminalOpen((prev) => !prev),
    [],
  );

  const handleResize = useCallback(() => {
    fitAddon.fit();
  }, [fitAddon]);

  // Main cleanup effect for the entire hook
  useEffect(() => {
    return () => {
      dispose();
    };
  }, [dispose]);

  // Effect for updating terminal theme when the app theme changes
  useEffect(() => {
    if (!term) return;
    const newTheme = getTerminalTheme($theme);
    term.options.theme = newTheme;
    term.refresh(0, term.rows - 1);
  }, [term, $theme]);

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
