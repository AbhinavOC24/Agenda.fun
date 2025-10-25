// lib/convertors.ts

// Convert bytes32 array to Buffer (existing function - keep this)
export function normalizeBytes32(input: number[] | Uint8Array): Buffer {
  const arr = new Uint8Array(32);
  const src = Uint8Array.from(input ?? []);
  arr.set(src.slice(0, 32));
  return Buffer.from(arr);
}

// NEW: Convert bytes32 array to readable string
export function normalizeBytes32ToString(input: number[] | Uint8Array): string {
  const arr = new Uint8Array(32);
  const src = Uint8Array.from(input ?? []);
  arr.set(src.slice(0, 32));

  let length = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === 0) break;
    length++;
  }

  const decoder = new TextDecoder();
  return decoder.decode(arr.slice(0, length));
}
