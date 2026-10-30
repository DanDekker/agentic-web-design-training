// Flush pending output and avoid redundant decoder.configure() calls when metadata changes.
function stableConfigValue(value) {
  if (value instanceof ArrayBuffer) return [...new Uint8Array(value)];
  if (ArrayBuffer.isView(value)) {
    return [...new Uint8Array(value.buffer, value.byteOffset, value.byteLength)];
  }
  if (Array.isArray(value)) return value.map(stableConfigValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, stableConfigValue(value[key])]),
    );
  }
  return value;
}

function configSignature(config) {
  return JSON.stringify(stableConfigValue(config));
}

export class DecoderConfigRouter {
  #decoder;
  #signature = null;

  constructor(decoder) {
    if (!decoder || typeof decoder.configure !== "function" || typeof decoder.decode !== "function") {
      throw new TypeError("A decoder with configure() and decode() is required.");
    }
    this.#decoder = decoder;
  }

  async decode(chunk, metadata = {}) {
    const nextConfig = metadata?.decoderConfig;
    if (nextConfig) {
      if (typeof nextConfig.codec !== "string" || nextConfig.codec.length === 0) {
        throw new TypeError("Decoder configuration needs a codec string.");
      }
      const nextSignature = configSignature(nextConfig);
      if (nextSignature !== this.#signature) {
        if (this.#signature !== null) await this.#decoder.flush();
        this.#decoder.configure(nextConfig);
        this.#signature = nextSignature;
      }
    }

    if (this.#signature === null) {
      const error = new Error("A key chunk with decoderConfig metadata must arrive before decoding.");
      error.name = "DataError";
      throw error;
    }
    return this.#decoder.decode(chunk);
  }

  async flush() {
    if (this.#signature === null) return false;
    await this.#decoder.flush();
    return true;
  }
}
