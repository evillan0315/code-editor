import { API_ENDPOINTS } from './api';

export const HTTP_STATUS = {
  PROGRESS: 'Progress',
  RESPONSE: 'Response',
  ERROR: 'Error',
} as const;

// Helper to convert string to camelCase
const toCamelCase = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/_([a-z])/g, (_, char) => char.toUpperCase());
};

// EVENT_PREFIX will be populated dynamically based on API_ENDPOINTS
export const EVENT_PREFIX: { [key: string]: string } = {};

// Populate EVENT_PREFIX based on API_ENDPOINTS
for (const groupKey in API_ENDPOINTS) {
  if (Object.prototype.hasOwnProperty.call(API_ENDPOINTS, groupKey)) {
    const groupEndpoints =
      API_ENDPOINTS[groupKey as keyof typeof API_ENDPOINTS];

    // Get base group name (e.g., "file", "eslint") by removing leading '_' and converting to camelCase
    const baseGroupName = toCamelCase(groupKey.substring(1));

    for (const endpointKey in groupEndpoints) {
      if (Object.prototype.hasOwnProperty.call(groupEndpoints, endpointKey)) {
        // Create the constant name for EVENT_PREFIX (e.g., FILE_CREATE)
        const constantName = `${groupKey.toUpperCase().substring(1)}_${endpointKey}`;

        // Create the camelCase event prefix (e.g., fileCreate, eslintLintCode)
        const endpointCamelCase = toCamelCase(endpointKey);
        const eventPrefixValue =
          baseGroupName +
          endpointCamelCase.charAt(0).toUpperCase() +
          endpointCamelCase.slice(1);

        EVENT_PREFIX[constantName] = eventPrefixValue;
      }
    }
  }
}
// After population, freeze EVENT_PREFIX to make it immutable
Object.freeze(EVENT_PREFIX);

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  DYNAMIC_FILE_EVENT: 'dynamicFileEvent',

  // File system watcher events
  FS_CHANGE_CREATED: 'fsChangeCreated',
  FS_CHANGE_DELETED: 'fsChangeDeleted',
  FS_CHANGE_RENAMED: 'fsChangeRenamed',
  FS_CHANGE_MODIFIED: 'fsChangeModified',
} as const;

// Create a mutable copy to add dynamically generated events
const mutableSocketEvents: Record<string, string> = { ...SOCKET_EVENTS };

// Iterate through the dynamically built EVENT_PREFIX to create merged socket events
for (const prefixConstantName in EVENT_PREFIX) {
  if (Object.prototype.hasOwnProperty.call(EVENT_PREFIX, prefixConstantName)) {
    const prefixValue = EVENT_PREFIX[prefixConstantName]; // e.g., 'fileCreate'

    for (const statusKey in HTTP_STATUS) {
      if (Object.prototype.hasOwnProperty.call(HTTP_STATUS, statusKey)) {
        const statusValue = HTTP_STATUS[statusKey as keyof typeof HTTP_STATUS]; // e.g., 'Progress'

        // Construct the full constant name (e.g., FILE_CREATE_PROGRESS)
        const fullConstantName = `${prefixConstantName}_${statusKey.toUpperCase()}`;

        // Construct the full socket event string (e.g., fileCreateProgress)
        const eventString = `${prefixValue}${statusValue}`;
        mutableSocketEvents[fullConstantName] = eventString;
      }
    }
  }
}

// Freeze the final combined object to make it immutable
export const SOCKET_EVENTS_MERGED = Object.freeze(mutableSocketEvents);

export const FILE_NAMESPACE = '/files';
