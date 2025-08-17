// src/StickyNote.tsx

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  CSSProperties,
} from "react";

import "@/styles/sticky-note.css"; // Import the CSS

// --- Type Definitions ---
export type ResizeHandle =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | null;

interface StickyNoteProps {
  id: string; // Unique ID for the note
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
  initialContent?: string;
  onClose?: (id: string) => void; // Callback when the note is closed
  onContentChange?: (id: string, content: string) => void; // Callback for content updates
  onPositionChange?: (id: string, x: number, y: number) => void; // Callback for position updates
  onSizeChange?: (id: string, width: number, height: number) => void; // Callback for size updates
  onFocus?: (id: string) => void; // Callback when the note is focused (brings to front)
  zIndex?: number; // Prop to control z-index
}

interface StickyNoteState {
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  isDragging: boolean;
  isResizing: boolean;
  dragOffsetX: number;
  dragOffsetY: number;
  resizeHandle: ResizeHandle;
  initialMouseX: number;
  initialMouseY: number;
  initialWidth: number;
  initialHeight: number;
  initialX: number;
  initialY: number;
}

// --- Constants ---
const MIN_WIDTH = 150;
const MIN_HEIGHT = 100;
const DEFAULT_Z_INDEX = 9999; // A high z-index to float above most elements

export const StickyNote: React.FC<StickyNoteProps> = ({
  id,
  initialX = 50,
  initialY = 50,
  initialWidth = 300,
  initialHeight = 200,
  initialContent = "New sticky note",
  onClose,
  onContentChange,
  onPositionChange,
  onSizeChange,
  onFocus,
  zIndex = DEFAULT_Z_INDEX,
}) => {
  const [state, setState] = useState<StickyNoteState>({
    x: initialX,
    y: initialY,
    width: initialWidth,
    height: initialHeight,
    content: initialContent,
    isDragging: false,
    isResizing: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    resizeHandle: null,
    initialMouseX: 0,
    initialMouseY: 0,
    initialWidth: 0,
    initialHeight: 0,
    initialX: 0,
    initialY: 0,
  });

  const noteRef = useRef<HTMLDivElement>(null); // Ref to the sticky note div

  // --- Event Handlers ---

  // Handles focus (bringing to front)
  const handleFocus = useCallback(() => {
    onFocus?.(id);
  }, [id, onFocus]);

  // Handles starting drag
  const handleDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      handleFocus();
      const noteElement = noteRef.current;
      if (!noteElement) return;

      setState((prevState) => ({
        ...prevState,
        isDragging: true,
        dragOffsetX: e.clientX - noteElement.getBoundingClientRect().left,
        dragOffsetY: e.clientY - noteElement.getBoundingClientRect().top,
      }));
    },
    [handleFocus],
  );

  // Handles starting resize
  const handleResizeStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, handle: ResizeHandle) => {
      handleFocus();
      e.stopPropagation(); // Prevent drag from starting simultaneously
      setState((prevState) => ({
        ...prevState,
        isResizing: true,
        resizeHandle: handle,
        initialMouseX: e.clientX,
        initialMouseY: e.clientY,
        initialWidth: prevState.width,
        initialHeight: prevState.height,
        initialX: prevState.x,
        initialY: prevState.y,
      }));
    },
    [handleFocus],
  );

  // Handles content changes
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setState((prevState) => ({ ...prevState, content: newContent }));
      onContentChange?.(id, newContent);
    },
    [id, onContentChange],
  );

  // --- Global Mouse Event Listeners (for dragging/resizing outside component bounds) ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (state.isDragging) {
        const newX = e.clientX - state.dragOffsetX;
        const newY = e.clientY - state.dragOffsetY;
        setState((prevState) => ({ ...prevState, x: newX, y: newY }));
        onPositionChange?.(id, newX, newY);
      } else if (state.isResizing && state.resizeHandle) {
        let { x, y, width, height } = state;
        const dx = e.clientX - state.initialMouseX;
        const dy = e.clientY - state.initialMouseY;

        switch (state.resizeHandle) {
          case "bottom-right":
            width = Math.max(MIN_WIDTH, state.initialWidth + dx);
            height = Math.max(MIN_HEIGHT, state.initialHeight + dy);
            break;
          case "bottom-left":
            width = Math.max(MIN_WIDTH, state.initialWidth - dx);
            x = state.initialX + (state.initialWidth - width);
            height = Math.max(MIN_HEIGHT, state.initialHeight + dy);
            break;
          case "top-right":
            width = Math.max(MIN_WIDTH, state.initialWidth + dx);
            height = Math.max(MIN_HEIGHT, state.initialHeight - dy);
            y = state.initialY + (state.initialHeight - height);
            break;
          case "top-left":
            width = Math.max(MIN_WIDTH, state.initialWidth - dx);
            x = state.initialX + (state.initialWidth - width);
            height = Math.max(MIN_HEIGHT, state.initialHeight - dy);
            y = state.initialY + (state.initialHeight - height);
            break;
          case "top":
            height = Math.max(MIN_HEIGHT, state.initialHeight - dy);
            y = state.initialY + (state.initialHeight - height);
            break;
          case "bottom":
            height = Math.max(MIN_HEIGHT, state.initialHeight + dy);
            break;
          case "left":
            width = Math.max(MIN_WIDTH, state.initialWidth - dx);
            x = state.initialX + (state.initialWidth - width);
            break;
          case "right":
            width = Math.max(MIN_WIDTH, state.initialWidth + dx);
            break;
        }
        setState((prevState) => ({ ...prevState, x, y, width, height }));
        onSizeChange?.(id, width, height);
        onPositionChange?.(id, x, y); // Position might change during resize
      }
    };

    const handleMouseUp = () => {
      if (state.isDragging || state.isResizing) {
        setState((prevState) => ({
          ...prevState,
          isDragging: false,
          isResizing: false,
          resizeHandle: null,
        }));
      }
    };

    if (state.isDragging || state.isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    state.isDragging,
    state.isResizing,
    state.dragOffsetX,
    state.dragOffsetY,
    state.resizeHandle,
    state.initialMouseX,
    state.initialMouseY,
    state.initialWidth,
    state.initialHeight,
    state.initialX,
    state.initialY,
    id,
    onPositionChange,
    onSizeChange,
  ]);

  // Styles for the note container
  const noteStyle: CSSProperties = {
    position: "absolute",
    left: state.x,
    top: state.y,
    width: state.width,
    height: state.height,
    backgroundColor: "#ffc",
    border: "1px solid #ccc",
    boxShadow: "2px 2px 8px rgba(0,0,0,0.3)",
    borderRadius: "5px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: zIndex, // Use the zIndex prop
    cursor: state.isDragging ? "grabbing" : "default",
    minWidth: `${MIN_WIDTH}px`,
    minHeight: `${MIN_HEIGHT}px`,
  };

  return (
    <div
      ref={noteRef}
      className="sticky-note"
      style={noteStyle}
      onMouseDown={handleFocus} // Bring to front on any click inside
    >
      {/* Draggable Header */}
      <div
        className="sticky-note-header"
        onMouseDown={handleDragStart}
        style={{
          padding: "8px 10px",
          backgroundColor: "#e0e099",
          borderBottom: "1px solid #ccc",
          cursor: state.isDragging ? "grabbing" : "grab",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          userSelect: "none",
          borderTopLeftRadius: "5px",
          borderTopRightRadius: "5px",
        }}
      >
        <span style={{ fontWeight: "bold" }}>Sticky Note {id}</span>
        {onClose && (
          <button
            onClick={() => onClose(id)}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.2em",
              cursor: "pointer",
              color: "#666",
              lineHeight: "1",
              padding: "0 5px",
            }}
          >
            &times;
          </button>
        )}
      </div>

      {/* Content Area */}
      <textarea
        value={state.content}
        onChange={handleContentChange}
        style={{
          flexGrow: 1,
          padding: "10px",
          border: "none",
          outline: "none",
          resize: "none", // Disable default textarea resize
          fontFamily: "inherit",
          fontSize: "1em",
          backgroundColor: "transparent",
        }}
      />

      {/* Resize Handles */}
      <div
        className="resize-handle top-left"
        onMouseDown={(e) => handleResizeStart(e, "top-left")}
      />
      <div
        className="resize-handle top-right"
        onMouseDown={(e) => handleResizeStart(e, "top-right")}
      />
      <div
        className="resize-handle bottom-left"
        onMouseDown={(e) => handleResizeStart(e, "bottom-left")}
      />
      <div
        className="resize-handle bottom-right"
        onMouseDown={(e) => handleResizeStart(e, "bottom-right")}
      />
      <div
        className="resize-handle top"
        onMouseDown={(e) => handleResizeStart(e, "top")}
      />
      <div
        className="resize-handle bottom"
        onMouseDown={(e) => handleResizeStart(e, "bottom")}
      />
      <div
        className="resize-handle left"
        onMouseDown={(e) => handleResizeStart(e, "left")}
      />
      <div
        className="resize-handle right"
        onMouseDown={(e) => handleResizeStart(e, "right")}
      />
    </div>
  );
};

// Define the shape of a note item managed by App.tsx
interface NoteItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  zIndex: number;
}

export function NoteApp() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const nextNoteId = useRef(0);
  const maxZIndex = useRef(StickyNote.defaultProps?.zIndex || 9999); // Track the highest z-index

  const addNote = useCallback(() => {
    const newId = String(nextNoteId.current++);
    const newNote: NoteItem = {
      id: newId,
      x: 50 + notes.length * 20, // Stagger new notes
      y: 50 + notes.length * 20,
      width: 300,
      height: 200,
      content: `This is note ${newId}.`,
      zIndex: ++maxZIndex.current, // Give new note highest z-index
    };
    setNotes((prevNotes) => [...prevNotes, newNote]);
  }, [notes.length]);

  const handleClose = useCallback((id: string) => {
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
  }, []);

  const handleContentChange = useCallback((id: string, content: string) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) => (note.id === id ? { ...note, content } : note)),
    );
  }, []);

  const handlePositionChange = useCallback(
    (id: string, x: number, y: number) => {
      setNotes((prevNotes) =>
        prevNotes.map((note) => (note.id === id ? { ...note, x, y } : note)),
      );
    },
    [],
  );

  const handleSizeChange = useCallback(
    (id: string, width: number, height: number) => {
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === id ? { ...note, width, height } : note,
        ),
      );
    },
    [],
  );

  const handleFocus = useCallback((id: string) => {
    setNotes((prevNotes) => {
      let currentMaxZ = maxZIndex.current;
      const updatedNotes = prevNotes.map((note) => {
        if (note.id === id) {
          currentMaxZ = Math.max(currentMaxZ, note.zIndex + 1);
          return { ...note, zIndex: currentMaxZ }; // Bring to front
        }
        return note;
      });
      maxZIndex.current = currentMaxZ;
      return updatedNotes;
    });
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <h1>My IDE - Sticky Notes Demo</h1>
      <p>
        Click "Add Note" to create a new sticky note. Drag, resize, and edit the
        content.
      </p>
      <button
        onClick={addNote}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          marginLeft: "20px",
          marginTop: "10px",
        }}
      >
        Add Note
      </button>

      {notes.map((note) => (
        <StickyNote
          key={note.id}
          id={note.id}
          initialX={note.x}
          initialY={note.y}
          initialWidth={note.width}
          initialHeight={note.height}
          initialContent={note.content}
          onClose={handleClose}
          onContentChange={handleContentChange}
          onPositionChange={handlePositionChange}
          onSizeChange={handleSizeChange}
          onFocus={handleFocus}
          zIndex={note.zIndex}
        />
      ))}
    </div>
  );
}
