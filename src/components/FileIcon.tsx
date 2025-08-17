// src/components/FileIcon.tsx

import React from "react";
import { Icon } from "@iconify/react";
import { getFileIcon } from "@/utils/fileIcon";

interface FileIconProps {
  filename: string;
  isDirectory: boolean;
  isOpen?: boolean;
  language?: string;
  iconName?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({
  filename,
  isDirectory,
  isOpen,
  language
}) => {
  const icon = getFileIcon({ filename, isDirectory, isOpen, language });
  return <Icon icon={icon} width="1.2em" height="1.2em" />;
};
