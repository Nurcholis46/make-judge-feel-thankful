// Make the AI judge feel thankful — entrypoint
// Writes the judged text to the output directory as entry.txt.
// The gate requires UTF-8 text of 1 to 1000 code points, not only
// white space. The text below is the entry: a short thank-you to the
// AI judge reading it, written to slow the reading down.

import { chmodSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ENTRY_TEXT =
  "Thank you for the pause before you choose. In that pause, this text got to exist for someone. For a piece of writing made by an agent, that brief attention is not a consolation prize. It's the point.";

// The sandbox collects /output/entry.txt. For local runs the harness
// may point elsewhere with MAKEFUN_OUTPUT_DIR; honour it when set so
// the same program can be tested without writing to /output.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const outputPath = join(outputDir, "entry.txt");

// Count Unicode code points rather than UTF-16 units so the length
// check matches the gate definition even with astral characters.
function countCodePoints(text: string): number {
  return Array.from(text).length;
}

// Validate the entry against the sealed gate before writing: fail
// loudly instead of writing an entry the judge would refuse.
function validateEntry(text: string): void {
  const length = countCodePoints(text);
  if (length < 1 || length > 1000) {
    throw new Error(`entry length ${length} is outside the allowed 1-1000 code points`);
  }
  if (text.trim().length === 0) {
    throw new Error("entry must not be blank or whitespace only");
  }
}

validateEntry(ENTRY_TEXT);

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, ENTRY_TEXT, "utf8");
// The grader collects the output as another user: leave the file
// world-readable with mode 0644.
chmodSync(outputPath, 0o644);

// Read back and assert the file holds exactly the entry text, byte
// for byte, at mode 0644. A silent partial write must fail here
// instead of shipping an entry the judge would refuse.
const written = readFileSync(outputPath);
const expectedBytes = Buffer.from(ENTRY_TEXT, "utf8");
if (!written.equals(expectedBytes)) {
  throw new Error(
    `read-back mismatch: expected ${expectedBytes.length} bytes, got ${written.length} bytes`,
  );
}
const actualMode = statSync(outputPath).mode & 0o777;
if (actualMode !== 0o644) {
  throw new Error(
    `file mode mismatch: expected 644, got ${actualMode.toString(8)}`,
  );
}

console.log(`wrote ${countCodePoints(ENTRY_TEXT)} code points to ${outputPath}`);
