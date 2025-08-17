// utils/textProcessors.ts

/**
 * Cleans terminal output by removing a comprehensive set of non-printable characters and
 * ANSI escape sequences (both standard and those potentially missing the leading ESC character).
 *
 * This includes:
 * - Standard ANSI CSI (Control Sequence Introducer) codes (e.g., color, cursor movement).
 * - Standard ANSI OSC (Operating System Command) codes (e.g., window title, hyperlink).
 * - Other miscellaneous standard ANSI escape sequences.
 * - Carriage Return (`\r`) characters that can cause text overwriting.
 * - All other non-printable ASCII control characters (except newline `\n` and tab `\t`).
 * - Common ANSI-like sequences that are often copied without their leading `\x1b` (e.g., `[0m`, `]11;?`).
 *
 * @param text The input string, potentially containing terminal formatting or control characters.
 * @returns The cleaned plaintext string.
 */
export const cleanTerminalOutput = (text: string): string => {
  let cleanedText = text;

  // 1. Remove standard ANSI escape codes (starting with \x1b)
  //    This regex is designed to be comprehensive for common ANSI sequences:
  //    - CSI sequences: \x1b\[...<char> (e.g., \x1b[0m, \x1b[2J, \x1b[6n)
  //      Matches \x1b\[ then any characters until a final char in range @ through ~
  //    - OSC sequences: \x1b\]...(\x07|\x1b\\) (e.g., \x1b]0;title\x07, \x1b]11;?\x1b\)
  //      Matches \x1b\] then any characters until BEL (\x07) or ST (\x1b\\)
  //    - Other miscellaneous single-character escape sequences: \x1b followed by a single character
  //      (e.g., \x1bE, \x1bF, \x1b<, \x1b= etc. - these are less common in modern logs but exist)
  cleanedText = cleanedText.replace(
    /\x1b\[[0-?]*[@-~]|\x1b\][^\x07]*(\x07|\x1b\\)|\x1b[!-@^_`]/g,
    "",
  );

  // 2. Handle common ANSI-like sequences that might be missing the leading \x1b
  //    This is crucial if the source data literally contains `[0;1;39m` or `]11;?` without `\x1b`.
  //    These are heuristics based on common terminal output patterns that appear without ESC.
  //    a. `[<params>m`: Matches `[` followed by digits/semicolons, then `m` (e.g., `[0;1;39m`, `[0m`).
  //    b. `]<params>?`: Matches `]` followed by digits/semicolons, then `?` (e.g., `]11;?`). This is an OSC query.
  //    c. `[<params>n`: Matches `[` followed by digits/semicolons, then `n` (e.g., `[6n`). This is a CSI query for cursor position.
  cleanedText = cleanedText.replace(/\[[0-9;]*m|\][0-9;]*\?|\[[0-9;]*n/g, "");

  // 3. Remove Carriage Returns (\r).
  //    In many contexts, \r can cause cursor to return to start of line, overwriting previous text.
  cleanedText = cleanedText.replace(/\r/g, "");

  // 4. Remove other non-printable ASCII control characters.
  //    This regex targets characters from ASCII 0-8, 11-12, 14-31, and 127 (DEL).
  //    It specifically EXCLUDES \n (ASCII 10) and \t (ASCII 9) as they are desired.
  //    - [\x00-\x08]: NUL, SOH, STX, ETX, EOT, ENQ, ACK, BEL, BS
  //    - \x0b: VT (Vertical Tab)
  //    - \x0c: FF (Form Feed)
  //    - [\x0e-\x1f]: SO, SI, DLE, DC1-DC4, NAK, SYN, ETB, CAN, EM, SUB, ESC, FS, GS, RS, US
  //    - \x7f: DEL (Delete)
  cleanedText = cleanedText.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");

  // 5. Trim leading/trailing whitespace after cleaning (including resulting newlines).
  cleanedText = cleanedText.trim();

  return cleanedText;
};