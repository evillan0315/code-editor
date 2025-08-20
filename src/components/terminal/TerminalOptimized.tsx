import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  ChangeEvent,
  KeyboardEvent,
  useMemo,
} from 'react';

import { useStore } from '@nanostores/react';
import { editorCurrentDirectory } from '@/stores/editorContent';
import { toggleTerminal } from '@/stores/layout';
import { io, Socket } from 'socket.io-client';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { truncateFilePath, joinPaths, getDirname, getBasename } from '@/utils/pathUtils'; // Import browser-compatible path utilities
import CommandLineOutputViewer from '@/components/terminal/CommandLineOutputViewer';

import { useEditorExplorerActions } from '@/hooks/useEditorExplorerActions';
import InputContextMenu from '@/components/terminal/InputContextMenu';
import { fileService } from '@/services';

// Define CommandDetail interface here, as Terminal.tsx now manages this data
interface CommandDetail {
  name: string;
  description: string;
  icon: string;
  options: string[];
  instructions: string;
  context: string;
  topics: string[];
  tags?: string[];
}

interface TerminalEntry {
  type:
    | 'message'
    | 'command'
    | 'error'
    | 'outputMessage'
    | 'system'
    | 'success'
    | 'info'
    | 'typewriter';
  content: string;
}

// NEW: Interface for Interactive List Prompts
interface InteractiveListPromptState {
  question: string;
  choices: { name: string; value: string }[];
  activeIndex: number;
}

interface TerminalProps {
  isResizing?: boolean;
}

const Terminal: React.FC<TerminalProps> = ({ isResizing }) => {
  const { fetchAndSetFileTree } = useEditorExplorerActions();
  const editorCurrentDir = useStore(editorCurrentDirectory);
  //const showTerminalPanel = useStore(showTerminal);

  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const [cmd, setCmd] = useState<string>('');
  const [placeholder, setPlaceholder] = useState<string>('Type a command...');
  const [cwd, setCwd] = useState<string>(editorCurrentDir);
  const [homeDir, setHomeDir] = useState<string>('~');
  const [isAuth, setIsAuth] = useState<boolean>(true);
  const [status, setStatus] = useState<string>('Disconnected');
  const [outputMessage, setOutputMessage] = useState<TerminalEntry | null>(null);
  const [showContextMenu, setShowContextMenu] = useState<boolean>(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [filteredContextMenuOptions, setFilteredContextMenuOptions] = useState<CommandDetail[]>([]);

  // NEW: State for command history
  const [commandHistory, setCommandHistory] = useState<string[]>(() => {
    try {
      const storedHistory = localStorage.getItem('terminalCommandHistory');
      return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (e) {
      console.error('Failed to load command history from localStorage', e);
      return [];
    }
  });
  const [historyIndex, setHistoryIndex] = useState<number>(commandHistory.length); // Points to the next available slot for new commands, or current command being edited

  // NEW: State for general text input prompt handling (e.g., password, simple questions)
  const [awaitingTextInputPrompt, setAwaitingTextInputPrompt] = useState<boolean>(false);
  const [textInputValue, setTextInputValue] = useState<string>('');
  const textInputRef = useRef<HTMLInputElement>(null); // Ref for the text input prompt

  // NEW: State for interactive list prompt handling (e.g., inquirer choices)
  const [interactivePromptState, setInteractivePromptState] =
    useState<InteractiveListPromptState | null>(null);
  const interactivePromptRef = useRef<HTMLDivElement>(null); // Ref for the interactive list container

  const outputRef = useRef<HTMLDivElement>(null);
  const mainInputRef = useRef<HTMLTextAreaElement>(null); // Renamed from inputRef for clarity

  const defaultTextareaHeight = 'auto';

  // Moved availableOptions from InputContextMenu to Terminal
  const availableOptions: Record<string, CommandDetail>[] = useMemo(
    () => [
      {
        generate: {
          name: 'Generate',
          description:
            'Generate content, scripts, code, documentations, snippets, or custom topic you prefer. Add topics, instructions and context for better responses',
          icon: 'streamline:ai-generate-variation-spark',
          options: ['code', 'documentation', 'tutorials', 'content', 'custom'],
          instructions: '',
          context: '',
          topics: [],
        },
      },
      {
        convert: {
          name: 'Convert',
          description:
            'Convert document, files, code, or custom type. Add topics, instructions and context for better responses',
          icon: 'fluent:convert-to-text-24-filled',
          options: ['code', 'content', 'files', 'documents', 'custom'],
          instructions: '',
          context: '',
          topics: [],
        },
      },
      {
        open: {
          name: 'Open',
          description:
            'Open document, files, code, or custom type. Add topics, instructions and context for better responses',
          icon: 'pixelarticons:open',
          options: ['code', 'content', 'files', 'documents', 'custom'],
          instructions: '',
          context: '',
          topics: [],
        },
      },
      {
        build: {
          name: 'Build',
          description:
            'Build applications, servers, microservices, databases, or custom services. Add topics, instructions and context for better responses',
          icon: 'carbon:build-run',
          options: ['applications', 'servers', 'microservices', 'databases', 'custom'],
          instructions: '',
          context: '',
          topics: [],
        },
      },
      {
        automate: {
          name: 'Automate',
          description:
            'Run automations, analyze, organize, resources, crons, or custom context. Add topics, instructions and context for better responses',
          icon: 'carbon:workflow-automation',
          options: ['deployment', 'workflows', 'jobs', 'custom'],
          instructions: '',
          context: '',
          topics: [],
        },
      },
      {
        clear: {
          name: 'Clear Terminal',
          description: 'Clears the terminal history',
          icon: 'mdi:eraser',
          options: [],
          instructions: '',
          context: '',
          topics: [],
        },
      },
    ],
    [],
  );

  // Effect to filter context menu options based on cmd input
  useEffect(() => {
    if (cmd.startsWith('/')) {
      const flatOptions: CommandDetail[] = availableOptions.flatMap((optionItem) =>
        Object.values(optionItem),
      );

      const cleanedInput = cmd.slice(1).toLowerCase(); // Remove '/' prefix for filtering

      const filtered = flatOptions.filter((detail) =>
        detail.name.toLowerCase().includes(cleanedInput),
      );
      setFilteredContextMenuOptions(filtered);
      setShowContextMenu(filtered.length > 0); // Only show if there are filtered options
    } else {
      setShowContextMenu(false);
      setFilteredContextMenuOptions([]);
    }
  }, [cmd, availableOptions]); // Dependencies on cmd and availableOptions

  // Effect to save command history to localStorage
  useEffect(() => {
    localStorage.setItem('terminalCommandHistory', JSON.stringify(commandHistory));
  }, [commandHistory]);

  const scrollToBottom = useCallback((): void => {
    if (outputRef.current) {
      requestAnimationFrame(() => {
        if (outputRef.current) {
          outputRef.current.scrollTop = outputRef.current.scrollHeight;
        } else {
          console.log('outputRef.current is null during requestAnimationFrame');
        }
      });
    } else {
      console.log('outputRef is null before requestAnimationFrame');
    }
  }, []);

  const handleOutputContentChange = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  // NEW: Refactored addEntryOptimized to handle interactive prompts
  const addEntryOptimized = useCallback(
    (type: TerminalEntry['type'], rawContent: string): void => {
      // First, check for inquirer-style interactive list prompts
      // Example: '? Apply this change to ... (Use arrow keys)\n❯ Yes ...\n  No ...'
      const listPromptRegex =
        /\? (.+?)\s*\((Use arrow keys|type to filter)\)\n((?:[\s\S]*?)(?:\s+❯\s.*|\s+[\s\S]*?)*)/;
      const listMatch = rawContent.match(listPromptRegex);

      if (listMatch) {
        const question = listMatch[1].trim();
        const choicesText = listMatch[3];
        const rawChoices = choicesText
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        const choices = rawChoices.map((choiceLine) => {
          const isSelected = choiceLine.startsWith('❯');
          const name = choiceLine.replace(/^❯\s*/, '').replace(/\s*\(\S+\)$/, ''); // Remove '❯' and optional info like (currently)
          const value = name; // In inquirer list prompts, the displayed name is often the value
          return { name, value, isSelected };
        });

        const activeIndex = choices.findIndex((c) => c.isSelected);

        setInteractivePromptState({
          question,
          choices: choices.map(({ name, value }) => ({ name, value })),
          activeIndex: activeIndex !== -1 ? activeIndex : 0, // Default to first if no '❯'
        });

        // Hide regular text input and general prompt input when interactive prompt is active
        setAwaitingTextInputPrompt(false);
        setTextInputValue('');
        setOutputMessage(null); // Clear any pending output message

        setTimeout(() => {
          interactivePromptRef.current?.focus(); // Focus the interactive prompt section
        }, 50);
        return; // Do not add this raw content to terminal entries
      }

      // Handle general text input prompts (e.g., password, single line)
      const isPasswordPrompt = /([Ss]udo)?\s*([Pp]assword|password for)/.test(rawContent);
      const isConfirmPrompt = /\?\[(Y\/n|y\/N)\]/i.test(rawContent);
      const isGeneralInputPrompt = /: $/.test(rawContent) && !isPasswordPrompt; // Ends with ': ' but not a password prompt

      if (isPasswordPrompt || isConfirmPrompt || isGeneralInputPrompt) {
        setAwaitingTextInputPrompt(true);
        // Clear interactive prompt if a text input prompt appears
        setInteractivePromptState(null);
        setTimeout(() => {
          textInputRef.current?.focus();
        }, 50);
      } else {
        // If new content arrives and no prompt is detected, assume previous prompt is resolved
        setAwaitingTextInputPrompt(false);
        setTextInputValue('');
        // Re-focus main input if no longer awaiting prompt (and no interactive prompt is active)
        if (!interactivePromptState) {
          setTimeout(() => {
            mainInputRef.current?.focus();
          }, 50);
        }
      }

      const authRequired = rawContent === 'Authentication required';

      if (type === 'outputMessage' || (type === 'error' && authRequired)) {
        if (authRequired) {
          setIsAuth(false);
          if (mainInputRef.current) {
            mainInputRef.current.disabled = true;
          }
        } else {
          setIsAuth(true);
          if (mainInputRef.current) {
            mainInputRef.current.disabled = false;
          }
        }
        setOutputMessage({ type, content: rawContent });
        return;
      }

      setEntries((prevEntries) => {
        if (
          prevEntries[prevEntries.length - 1]?.content === rawContent &&
          type === prevEntries[prevEntries.length - 1]?.type
        ) {
          return prevEntries;
        }
        return [...prevEntries, { type, content: rawContent }];
      });
    },
    [interactivePromptState], // Dependency to check its state
  );

  const sendCommand = useCallback((): void => {
    if (cmd.trim()) {
      const trimmedCmd = cmd.trim();
      // Add command to history
      setCommandHistory((prevHistory) => {
        const newHistory = [...prevHistory, trimmedCmd];
        return newHistory;
      });
      setHistoryIndex(commandHistory.length + 1); // Reset index to 'after last command'

      // Send command via `input` channel to the persistent PTY
      socketRef.current?.emit('input', { input: trimmedCmd + '\n' });

      setCmd('');
      if (mainInputRef.current) {
        mainInputRef.current.style.height = defaultTextareaHeight;
      }
    } else {
      // Allow sending empty newline if cmd is empty (e.g., just pressing Enter)
      socketRef.current?.emit('input', { input: '\n' });
    }
  }, [cmd, commandHistory]); // Depend on commandHistory to ensure latest state is used when adding

  // Handle general text input submission
  const handleTextInputEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (textInputValue.trim()) {
          // Send the prompt response via the 'input' event
          socketRef.current?.emit('input', { input: textInputValue + '\n' });

          // Add a placeholder entry to the terminal output for non-password prompts
          if (!/([Ss]udo)?\s*([Pp]assword|password for)/.test(textInputValue)) {
            addEntryOptimized('command', `(input hidden: ${textInputValue.length} chars)`);
          } else {
            addEntryOptimized('command', '[password hidden]');
          }

          setTextInputValue('');
          setAwaitingTextInputPrompt(false);
          mainInputRef.current?.focus(); // Re-focus the main command input
        }
      }
    },
    [textInputValue, addEntryOptimized],
  );

  // NEW: Handle interactive list prompt keyboard events
  const handleInteractivePromptKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>): void => {
      if (!interactivePromptState) return;

      let newIndex = interactivePromptState.activeIndex;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newIndex = Math.max(0, interactivePromptState.activeIndex - 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newIndex = Math.min(
            interactivePromptState.choices.length - 1,
            interactivePromptState.activeIndex + 1,
          );
          break;
        case 'Enter':
          e.preventDefault();
          const selectedChoice = interactivePromptState.choices[interactivePromptState.activeIndex];
          if (selectedChoice) {
            // Send the selected value + newline back to the PTY
            socketRef.current?.emit('input', { input: selectedChoice.value + '\n' });
            addEntryOptimized('command', `(selected: ${selectedChoice.name})`); // Add a log for the selection

            // Reset interactive prompt state
            setInteractivePromptState(null);
            setTextInputValue('');
            setAwaitingTextInputPrompt(false);
            mainInputRef.current?.focus(); // Re-focus the main command input
          }
          return; // Prevent further handling if Enter is pressed
        default:
          return; // Ignore other keys for now
      }

      if (newIndex !== interactivePromptState.activeIndex) {
        setInteractivePromptState((prevState) => {
          if (!prevState) return null;
          return { ...prevState, activeIndex: newIndex };
        });
      }
    },
    [interactivePromptState, addEntryOptimized],
  );

  const handleInput = useCallback((e: ChangeEvent<HTMLTextAreaElement>): void => {
    const value = e.currentTarget.value;
    setCmd(value);

    const textarea = e.currentTarget;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;

    // Position context menu
    if (value.startsWith('/')) {
      const rect = textarea.getBoundingClientRect();
      const menuHeight = 300;
      const gap = 6;
      const menuTopY = rect.top - menuHeight - gap;
      setContextMenuPosition({ x: rect.left, y: menuTopY });
      // showContextMenu state is now managed by the useEffect above
    } else {
      // showContextMenu state is now managed by the useEffect above
    }
  }, []);

  const handleSelectAndSendCommand = useCallback(
    (option: string): void => {
      if (option === 'Clear Terminal') {
        setEntries([]);
        setCmd('');
        setCommandHistory([]); // Clear command history too
        setHistoryIndex(0);
      } else {
        // Display the selected command as if typed by user
        addEntryOptimized('command', `${cwd}  $ ${option}\n`);

        // Add to history and send
        setCommandHistory((prevHistory) => {
          const newHistory = [...prevHistory, option];
          return newHistory;
        });
        setHistoryIndex(commandHistory.length + 1); // Reset index after adding new command

        // Send the command via the persistent PTY input
        socketRef.current?.emit('input', { input: option + '\n' });

        setCmd('');
        if (mainInputRef.current) {
          mainInputRef.current.style.height = defaultTextareaHeight;
        }
      }
      setShowContextMenu(false);
    },
    [addEntryOptimized, cwd, commandHistory.length], // Added commandHistory.length as dependency for setHistoryIndex
  );

  const handleMainInputKeyDown = useCallback(
    async (e: KeyboardEvent<HTMLTextAreaElement>): Promise<void> => {
      const textarea = e.currentTarget;
      const caretPos = textarea.selectionStart;

      if (e.key === 'Enter') {
        if (!e.shiftKey) {
          e.preventDefault();

          // sendCommand now handles adding to history and sending to PTY, and clearing cmd
          sendCommand();

          setShowContextMenu(false);
          textarea.style.height = 'auto';
        } else {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newValue = cmd.substring(0, start) + '\n' + cmd.substring(end);
          setCmd(newValue);

          e.preventDefault();
          textarea.style.height = 'auto';
          textarea.style.height = `${textarea.scrollHeight}px`;
        }
      } else if (e.key === 'Tab') {
        e.preventDefault(); // Always prevent default tab behavior

        if (showContextMenu && filteredContextMenuOptions.length > 0) {
          const firstOption = filteredContextMenuOptions[0].name;
          setCmd(`/${firstOption}`); // Set the command to the first filtered option
          setShowContextMenu(false); // Hide the context menu after auto-completion
        } else if (
          cmd.startsWith('cd ') ||
          cmd.startsWith('ls ') ||
          cmd.startsWith('cat ') ||
          cmd.startsWith('mkdir ') ||
          cmd.startsWith('rm ') ||
          cmd.startsWith('touch ') ||
          cmd.startsWith('mv ') ||
          cmd.startsWith('cp ')
        ) {
          // Add more path-related commands as needed
          const commandPart = cmd.split(' ')[0];
          const pathArgument = cmd.substring(commandPart.length + 1);

          let baseDirectory = '';
          let partialFileName = '';

          if (pathArgument.includes('/')) {
            baseDirectory = joinPaths(editorCurrentDir, getDirname(pathArgument));
            partialFileName = getBasename(pathArgument);
          } else {
            baseDirectory = editorCurrentDir;
            partialFileName = pathArgument;
          }

          try {
            // Fetch files/directories from the baseDirectory
            const items = await fileService.list(baseDirectory);

            // Filter items that start with the partialFileName
            const matchingItems = items.filter((item) =>
              item.name.toLowerCase().startsWith(partialFileName.toLowerCase()),
            );

            if (matchingItems.length > 0) {
              // Sort for consistent completion (e.g., directories first or alphabetically)
              matchingItems.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
              });

              const firstMatch = matchingItems[0];

              // Find the longest common prefix among all matching items if there are multiple,
              // otherwise just use the first match's full name.
              let commonPrefix = firstMatch.name;
              if (matchingItems.length > 1) {
                // Calculate longest common prefix for multiple matches
                for (let i = 1; i < matchingItems.length; i++) {
                  const currentName = matchingItems[i].name;
                  let j = 0;
                  while (
                    j < commonPrefix.length &&
                    j < currentName.length &&
                    commonPrefix[j] === currentName[j]
                  ) {
                    j++;
                  }
                  commonPrefix = commonPrefix.substring(0, j);
                }
              }

              let completedPathSegment = commonPrefix;
              if (matchingItems.length === 1 && firstMatch.isDirectory) {
                completedPathSegment += '/'; // Append '/' for directories when there's a unique match
              }

              const newPathArgument = joinPaths(getDirname(pathArgument), completedPathSegment);
              const newCmd = `${commandPart} ${newPathArgument}`;
              setCmd(newCmd);

              // Manually set cursor position after updating value
              setTimeout(() => {
                if (mainInputRef.current) {
                  mainInputRef.current.selectionStart = mainInputRef.current.selectionEnd =
                    newCmd.length;
                  mainInputRef.current.focus();
                }
              }, 0);
            }
          } catch (error) {
            console.error('Error fetching path completions:', error);
            addEntryOptimized('error', `Error auto-completing path: ${(error as Error).message}`);
          }
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setCmd(commandHistory[newIndex]);
          // Adjust textarea height for the retrieved command
          if (mainInputRef.current) {
            mainInputRef.current.style.height = 'auto';
            mainInputRef.current.style.height = `${mainInputRef.current.scrollHeight}px`;
          }
        } else if (historyIndex === 0 && commandHistory.length > 0) {
          // Stay at the first command (do nothing or set to first if not already there)
          setCmd(commandHistory[0]);
          setHistoryIndex(0);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setCmd(commandHistory[newIndex]);
          // Adjust textarea height for the retrieved command
          if (mainInputRef.current) {
            mainInputRef.current.style.height = 'auto';
            mainInputRef.current.style.height = `${mainInputRef.current.scrollHeight}px`;
          }
        } else if (historyIndex === commandHistory.length - 1) {
          // Go past the last command to an empty input
          setHistoryIndex(commandHistory.length);
          setCmd('');
        }
      }
    },
    [
      cmd,
      sendCommand,
      addEntryOptimized,
      showContextMenu,
      filteredContextMenuOptions,
      commandHistory,
      historyIndex,
      editorCurrentDir,
    ],
  );

  useEffect(() => {
    const token = localStorage.getItem('token');

    const s = io(`${import.meta.env.VITE_WS_URL}/terminal`, {
      auth: { token: `Bearer ${token}` },
      query: {
        initialCwd: editorCurrentDir 
      },
      transports: ['websocket', 'polling'],
      forceNew: true,
    });

    socketRef.current = s;

    s.emit('joinRoom', 'room-123');

    s.on('joinedRoom', (data: { message: string }) => {
      addEntryOptimized('system', `Joined Room: ${data.message}`);
    });

    s.on('userJoined', (data: { message: string }) => {
      addEntryOptimized('system', data.message);
    });

    s.on('connect', () => {
      setStatus('Connected');
      if (mainInputRef.current) {
        mainInputRef.current.disabled = false;
      }
      addEntryOptimized('system', 'Type `help` for commands.\n');
      addEntryOptimized('system', '[SYSTEM] Connected to terminal backend.');

      // NEW: Send the editor's current directory to the backend if it exists
      const currentEditorCwd = editorCurrentDirectory.get();
      if (currentEditorCwd && currentEditorCwd.trim() !== '') {
        socketRef.current?.emit('set_cwd', { cwd: currentEditorCwd });
      }

      scrollToBottom();
    });

    s.on('disconnect', () => {
      setStatus('Disconnected');
      if (mainInputRef.current) {
        mainInputRef.current.disabled = true;
      }
      addEntryOptimized('error', '[ERROR] Disconnected from terminal backend.');
    });

    s.on('connect_error', (err: Error) => {
      console.error('Connection Error:', err.message);
      if (mainInputRef.current) {
        mainInputRef.current.disabled = true;
      }
      setStatus('Disconnected');
      addEntryOptimized('error', `Connection Error: ${err.message}`);
    });

    s.on('osinfo', (info: { homedir: string }) => {
      setHomeDir(info.homedir);
    });

    s.on('outputMessage', (data: string) => {
      setOutputMessage({ type: 'outputMessage', content: data });
    });

    s.on('output', (data: string) => {
      addEntryOptimized('message', data); // This is where all PTY output comes in
    });

    s.on('error', (data: string) => {
      addEntryOptimized('error', `Server Error: ${data}`);
    });

    s.on('close', (msg: string) => {
      addEntryOptimized('info', `[INFO] ${msg}`);
    });

    s.on('prompt', ({ cwd: promptCwd, command }: { cwd: string; command: string }) => {
      if (promptCwd && editorCurrentDirectory.get() !== promptCwd) {
        editorCurrentDirectory.set(promptCwd);
      }
    });

    return () => {
      s.disconnect();
    };
  }, [editorCurrentDir, addEntryOptimized, fetchAndSetFileTree, scrollToBottom]);

  useEffect(() => {
    if (mainInputRef.current) {
      const textarea = mainInputRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [cmd]);

  useEffect(() => {
    if (mainInputRef.current && cmd === '') {
      mainInputRef.current.style.height = defaultTextareaHeight;
    }
  }, [cmd, defaultTextareaHeight]);

  useEffect(() => {
    scrollToBottom();
  }, [isResizing, scrollToBottom]);

  useEffect(() => {
    if (outputMessage) {
      scrollToBottom();
    }
  }, [outputMessage, scrollToBottom]);

  // This useEffect synchronizes local `cwd` state and fetches file tree
  // when `editorCurrentDirectory` (nanostore) changes.
  useEffect(() => {
    if (editorCurrentDir && editorCurrentDir !== cwd) {
      setCwd(editorCurrentDir);
      addEntryOptimized('info', `[INFO] Editor directory changed to: ${editorCurrentDir}`);
      fetchAndSetFileTree();
    }
  }, [editorCurrentDir, cwd, addEntryOptimized, fetchAndSetFileTree]);

  const handleInputFocus = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const handleOutputContainerClick = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return;
    }
    if (interactivePromptState) {
      interactivePromptRef.current?.focus(); // Focus interactive prompt if active
    } else if (awaitingTextInputPrompt) {
      textInputRef.current?.focus();
    } else {
      mainInputRef.current?.focus();
    }
    scrollToBottom();
  };

  return (
    <>
      <div className='flex items-center justify-between px-1 py-0 border-b bg-secondary shadow-xs '>
        <div className={`flex gap-2 items-center justify-between `}>
          <Button className='p-0 m-0'>
            <Icon icon='mdi-light:console' width='1.7em' height='1.7em' />
          </Button>
          <span> Terminal </span>
        </div>
        <div className='flex items-center gap-0'>
          <Button onClick={() => setEntries([])} title='Clear terminal'>
            <Icon width='1.7em' height='1.7em' icon='mdi:trash' />
          </Button>
          <Button onClick={toggleTerminal} title='Close Terminal'>
            <Icon width='1.7em' height='1.7em' icon='mdi:close' />
          </Button>
        </div>
      </div>

      <div
        className='flex-1 overflow-auto px-4 py-2 scroll-smooth font-mono'
        ref={outputRef}
        onClick={handleOutputContainerClick}
        style={{ cursor: 'text' }}
      >
        {entries.map((entry, index) => (
          <CommandLineOutputViewer
            key={index}
            output={entry.content}
            lineClassName={
              entry.type === 'command'
                ? 'text-yellow-400 font-bold text-md'
                : entry.type === 'error'
                  ? 'text-red-400 italic '
                  : entry.type === 'system'
                    ? 'text-green-400 font-light space-y-0 h-full'
                    : entry.type === 'info'
                      ? 'text-sky-400'
                      : ''
            }
            lineHeight={18}
            lineWidth='100%'
            tabSpaces={8}
            typewriterEffect={entry.type === 'typewriter'}
            typewriterSpeed={5}
            onContentChange={handleOutputContentChange}
          />
        ))}

        {/* NEW: Interactive List Prompt Renderer */}
        {interactivePromptState && (
          <div
            className='interactive-prompt mt-2 focus:outline-none'
            tabIndex={0} // Make it focusable
            onKeyDown={handleInteractivePromptKeyDown}
            ref={interactivePromptRef}
          >
            <div className='text-purple-400 font-bold mb-1'>
              ? {interactivePromptState.question}
            </div>
            <div className='space-y-0'>
              {interactivePromptState.choices.map((choice, index) => (
                <div
                  key={index}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    index === interactivePromptState.activeIndex
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-neutral-300 hover:bg-neutral-700'
                  }`}
                  onClick={() => {
                    // Simulate Enter press for selected item
                    setInteractivePromptState((prevState) => {
                      if (!prevState) return null;
                      return { ...prevState, activeIndex: index };
                    });
                    // Need a slight delay to allow state update before sending
                    setTimeout(() => {
                      socketRef.current?.emit('input', { input: choice.value + '\n' });
                      addEntryOptimized('command', `(selected: ${choice.name})`);
                      setInteractivePromptState(null);
                      setTextInputValue('');
                      setAwaitingTextInputPrompt(false);
                      mainInputRef.current?.focus();
                    }, 50);
                  }}
                >
                  {index === interactivePromptState.activeIndex ? '❯ ' : '  '}
                  {choice.name}
                </div>
              ))}
            </div>
            <div className='text-neutral-500 text-sm mt-1'>
              (Use arrow keys to navigate, Enter to select)
            </div>
          </div>
        )}
      </div>

      <div className='pt-2 shadow-lg '>
        {showContextMenu && (
          <InputContextMenu
            position={contextMenuPosition}
            filteredOptions={filteredContextMenuOptions}
            inputValue={cmd}
            onSelect={handleSelectAndSendCommand}
          />
        )}
        <div className='flex-1 items-center justify-between px-2 mb-2 gap-1 relative '>
          {/* Render general text input prompt when active */}
          {awaitingTextInputPrompt && (
            <input
              ref={textInputRef}
              type={
                /([Ss]udo)?\s*([Pp]assword|password for)/.test(
                  entries[entries.length - 1]?.content || '',
                )
                  ? 'password'
                  : 'text'
              }
              className={`flex-1 text-sm w-full text-yellow-400 focus:outline-none focus:ring-0 resize-none overflow-hidden absolute left-2 z-50 p-2 
                ${!isAuth || !awaitingTextInputPrompt ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder='Enter password...'
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              onKeyDown={handleTextInputEnter}
              disabled={!isAuth || !awaitingTextInputPrompt}
              autoFocus={awaitingTextInputPrompt}
            />
          )}

          {/* Main command input, disabled if any type of prompt is awaiting input */}
          <textarea
            ref={mainInputRef} // Using mainInputRef
            className={`flex-1 w-full text-lg ${
              status === 'Connected' ? 'font-bold' : 'text-red-400'
            } px-1 py-1 focus:outline-none focus:ring-0 resize-none overflow-hidden 
              ${awaitingTextInputPrompt || interactivePromptState ? 'opacity-50 cursor-not-allowed' : ''}`}
            placeholder={`${status === 'Connected' ? ( awaitingTextInputPrompt ? '' : 'Type a command...'): status}`}
            value={cmd}
            autoFocus={!awaitingTextInputPrompt && !interactivePromptState} // Only auto-focus if no prompt
            onChange={handleInput}
            onKeyDown={handleMainInputKeyDown} // Using mainInputKeyDown
            onFocus={handleInputFocus}
            rows={1}
            disabled={!isAuth || awaitingTextInputPrompt || interactivePromptState !== null}
          />
        </div>
        <div className='flex gap-0 text-neutral-400 items-center justify-between px-1 bg-secondary border-t'>
          <div className='flex items-center px-2 gap-2 max-w-[50%]'>
            <span className='truncate ' title={`Current Directory: ${editorCurrentDir}`}>
              {truncateFilePath(editorCurrentDir)}
            </span>
          </div>

          <div className='flex gap-2'>
            <Button className='p-0 m-0'>
              <Icon icon='ph:plus-thin' width='1.2em' height='1.2em' />
            </Button>
            <Button className='p-0 m-0'>
              <Icon icon='material-symbols-light:folder-outline' width='1.7em' height='1.7em' />
            </Button>
            <Button className='p-0 m-0 text-neutral-300'>
              <Icon icon='fluent:mic-32-light' width='1.7em' height='1.7em' className='' />
            </Button>
            <Button className='p-0 m-0 text-neutral-300'>
              <Icon icon='fluent:video-32-light' width='1.7em' height='1.7em' className='' />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Terminal;
