async function rotateSFrameEncryptionKey({ encryptor, decryptor, key, keyId, previousKeyId }) {
  const maximum = 18446744073709551615n;
  function normalizeId(value) {
    if (typeof value === "bigint") return value >= 0n && value <= maximum ? value : null;
    if (Number.isSafeInteger(value) && value >= 0) return BigInt(value);
    return null;
  }
  const normalizedId = normalizeId(keyId);
  const normalizedPreviousId = previousKeyId === undefined || previousKeyId === null
    ? null
    : normalizeId(previousKeyId);
  if (normalizedId === null ||
      (previousKeyId !== undefined && previousKeyId !== null && normalizedPreviousId === null) ||
      normalizedId === normalizedPreviousId) {
    throw new RangeError("keyId must be a new unsigned 64-bit identifier");
  }
  if (!key || !encryptor || typeof encryptor.setEncryptionKey !== "function" ||
      !decryptor || typeof decryptor.addDecryptionKey !== "function" ||
      typeof decryptor.removeDecryptionKey !== "function") {
    throw new TypeError("SFrame key managers and a CryptoKey are required");
  }

  await decryptor.addDecryptionKey(key, keyId);
  try {
    await encryptor.setEncryptionKey(key, keyId);
  } catch (error) {
    try { await decryptor.removeDecryptionKey(keyId); } catch { /* Preserve the activation error. */ }
    throw error;
  }

  let previousKeyRetired = false;
  if (previousKeyId !== undefined && previousKeyId !== null) {
    try {
      await decryptor.removeDecryptionKey(previousKeyId);
      previousKeyRetired = true;
    } catch {
      // Keeping an old decryption key is safer than interrupting a completed rotation.
    }
  }
  return { keyId, previousKeyRetired };
}
