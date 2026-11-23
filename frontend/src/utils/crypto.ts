/**
 * Calculates SHA-256 hash using browser native Web Crypto API (SubtleCrypto)
 */
export async function calculateSHA256(data: File | Blob | string | ArrayBuffer): Promise<string> {
  let buffer: ArrayBuffer;

  if (typeof data === 'string') {
    const encoder = new TextEncoder();
    buffer = encoder.encode(data).buffer;
  } else if (data instanceof File || data instanceof Blob) {
    buffer = await data.arrayBuffer();
  } else {
    buffer = data;
  }

  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Validates whether a given string is a valid 64-character SHA-256 hex string
 */
export function isValidSHA256(hash: string): boolean {
  return /^[a-fA-F0-9]{64}$/.test(hash.trim());
}

/**
 * Validates Ethereum transaction hash
 */
export function isValidTxHash(txHash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(txHash.trim());
}
