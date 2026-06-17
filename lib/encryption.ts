/**
 * AES-GCM encryption for environment variable values.
 * Uses the Web Crypto API (crypto.subtle) — available in Node.js 19+ and all modern browsers.
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

function getEncryptionKey(): string {
  const key = process.env.ENV_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "ENV_ENCRYPTION_KEY is not set. Generate one with: openssl rand -hex 32"
    );
  }
  return key;
}

async function getKey(): Promise<CryptoKey> {
  const rawKey = getEncryptionKey();
  // Import the hex-encoded key as raw bytes
  const keyBytes = new Uint8Array(
    rawKey.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a base64-encoded string: iv (12 bytes) + ciphertext + auth tag.
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );

  // Combine iv + ciphertext into a single buffer
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  // Return as base64
  return Buffer.from(combined).toString("base64");
}

/**
 * Decrypt a base64-encoded ciphertext produced by `encrypt()`.
 */
export async function decrypt(encrypted: string): Promise<string> {
  const key = await getKey();
  const combined = new Uint8Array(Buffer.from(encrypted, "base64"));

  // Extract iv (first 12 bytes) and ciphertext (rest)
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Encrypt a batch of env var values.
 */
export async function encryptEnvVars(
  vars: Array<{ key: string; value: string; target: string; projectId: string }>
): Promise<Array<{ key: string; value: string; target: string; projectId: string }>> {
  return Promise.all(
    vars.map(async (v) => ({
      ...v,
      value: await encrypt(v.value),
    }))
  );
}

/**
 * Decrypt a batch of env var values.
 */
export async function decryptEnvVars(
  vars: Array<{ id: string; key: string; value: string; target: string; projectId: string }>
): Promise<Array<{ id: string; key: string; value: string; target: string; projectId: string }>> {
  return Promise.all(
    vars.map(async (v) => ({
      ...v,
      value: await decrypt(v.value),
    }))
  );
}
