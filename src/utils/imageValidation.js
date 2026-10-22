const crypto = require("crypto");

const DEFAULT_MAX_BYTES = 3 * 1024 * 1024;

const maxImageBytes = () =>
  Number(process.env.ADJUNTO_MAX_BYTES) || DEFAULT_MAX_BYTES;

// El tipo se decide por los primeros bytes del archivo, nunca por lo que
// declare el cliente (Content-Type o extension).
const detectImageType = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 8) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (pngSignature.every((byte, index) => buffer[index] === byte)) {
    return { mime: "image/png", ext: "png" };
  }

  return null;
};

const sha256Hex = (buffer) =>
  crypto.createHash("sha256").update(buffer).digest("hex");

module.exports = { detectImageType, maxImageBytes, sha256Hex, DEFAULT_MAX_BYTES };
