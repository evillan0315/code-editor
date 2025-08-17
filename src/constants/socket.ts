// src/constants/socket.ts

export const HTTP_STATUS = {
  PROGRESS: 'Progress',
  RESPONSE: 'Response',
  ERROR: 'Error',
} as const;

export const EVENT_PREFIX = {
  FILE_UPLOAD: 'fileUpload',
  FILE_DOWNLOAD: 'fileDownload',
  READ_FILE: 'readFile',
  WRITE_FILE: 'writeFile',
  RENAME_FILE: 'renameFile',
  MOVE_FILE: 'moveFile',
  DELETE_FILES: 'deleteFiles',
  DELETE_FILE: 'deleteFile',
  CREATE_FILE: 'createFile',
  CREATE_FOLDER: 'createFolder',

  GET_FILES: 'getFiles',
  FORMAT_CODE: 'formatCode',
  OPTIMIZE_CODE: 'optimizeCode',
  REMOVE_CODE_COMMENT: 'removeCodeComment',
  STRIP_CODE_BLOCK: 'stripCodeBlock',
  REPAIR_CODE: 'repairCode',
  ANALYZE_CODE: 'analyzeCode',
  DYNAMIC_FILE_EVENT: 'dynamicFileEvent',
} as const;

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  DYNAMIC_FILE_EVENT: 'dynamicFileEvent',

  FS_CHANGE_CREATED: 'fsChangeCreated',
  FS_CHANGE_DELETED: 'fsChangeDeleted',
  FS_CHANGE_RENAMED: 'fsChangeRenamed',
  FS_CHANGE_MODIFIED: 'fsChangeModified',
} as const;

type EventPrefixKey = keyof typeof EVENT_PREFIX;
type HttpStatusKey = keyof typeof HTTP_STATUS;

const mutableSocketEvents: Record<string, string> = { ...SOCKET_EVENTS };

for (const prefixKey in EVENT_PREFIX) {
  if (Object.prototype.hasOwnProperty.call(EVENT_PREFIX, prefixKey)) {
    const prefixValue = EVENT_PREFIX[prefixKey as EventPrefixKey];

    for (const statusKey in HTTP_STATUS) {
      if (Object.prototype.hasOwnProperty.call(HTTP_STATUS, statusKey)) {
        const statusValue = HTTP_STATUS[statusKey as HttpStatusKey];

        const constantName = `${prefixKey.toUpperCase()}_${statusKey.toUpperCase()}`;

        const eventString = `${prefixValue}${statusValue}`;
        mutableSocketEvents[constantName] = eventString;
      }
    }
  }
}

export const SOCKET_EVENTS_MERGED = Object.freeze(mutableSocketEvents);

export const FILE_NAMESPACE = '/files';
