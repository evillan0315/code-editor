# Editor Components Documentation

This section provides comprehensive documentation for the components found within the `src/components/editor` directory. These components form the core UI and functionality of the integrated code editor.

## Overview

The editor module is designed to provide a rich development environment. It brings together a file explorer, a robust CodeMirror editor instance, a tabbed interface for open files, and customizable sidebars for additional tools like AI chat or a terminal.

At its core, the editor leverages [CodeMirror 6](https://codemirror.net/) for powerful text editing capabilities and integrates tightly with global state management (primarily via `nanostores`) to maintain file content, file tree state, and UI layout.

## Component Breakdown

Below is a list of all components in this module, with links to their dedicated documentation pages:

- [`CodeMirrorContextMenuRenderer`](./CodeMirrorContextMenuRenderer.md): Renders context menus specifically for CodeMirror interactions.
- [`CodeMirrorStatus`](./CodeMirrorStatus.md): Displays status information for the active CodeMirror editor.
- [`EditorCodeMirror`](./EditorCodeMirror.md): The core component wrapping the CodeMirror 6 instance.
- [`EditorExplorer`](./EditorExplorer.md): A generic component for displaying hierarchical data in a tree-like structure.
- [`EditorExplorerHeader`](./EditorExplorerHeader.md): Header component for the generic `EditorExplorer`.
- [`EditorExplorerNode`](./EditorExplorerNode.md): Renders individual nodes within the `EditorExplorer`.
- [`EditorFileExplorer`](./EditorFileExplorer.md): Displays the interactive file system tree.
- [`EditorFileExplorerHeader`](./EditorFileExplorerHeader.md): Header component for the `EditorFileExplorer`.
- [`EditorFileExplorerNode`](./EditorFileExplorerNode.md): Renders individual file or folder nodes within the `EditorFileExplorer`.
- [`EditorFileTabItem`](./EditorFileTabItem.md): Represents a single tab in the file tab bar.
- [`EditorFileTabs`](./EditorFileTabs.md): Manages and displays the open file tabs.
- [`EditorLeftSidebar`](./EditorLeftSidebar.md): The left collapsible sidebar container.
- [`EditorPageView`](./EditorPageView.md): The top-level component orchestrating the entire editor layout.
- [`EditorRightSidebar`](./EditorRightSidebar.md): The right collapsible sidebar container.
- [`FileExplorerContextMenuRenderer`](./FileExplorerContextMenuRenderer.md): Renders context menus specifically for file explorer interactions.
