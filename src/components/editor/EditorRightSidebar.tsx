//import React from 'react';
import { useStore } from '@nanostores/react';
import { showRightSidebar } from '@/stores/layout';

export function EditorRightSidebar() {
  const $visible = useStore(showRightSidebar);

  return <></>;
}
