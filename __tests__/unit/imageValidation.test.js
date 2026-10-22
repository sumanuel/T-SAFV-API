const {
  detectImageType,
  maxImageBytes,
  sha256Hex,
} = require("../../src/utils/imageValidation");

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);

describe("detectImageType", () => {
  it("reconoce JPEG y PNG por los primeros bytes", () => {
    expect(detectImageType(jpeg)).toEqual({ mime: "image/jpeg", ext: "jpg" });
    expect(detectImageType(png)).toEqual({ mime: "image/png", ext: "png" });
  });

  it("rechaza lo que no es una imagen aceptada, diga lo que diga el cliente", () => {
    expect(detectImageType(Buffer.from("<svg xmlns='x'></svg>"))).toBeNull();
    expect(detectImageType(Buffer.from("GIF89a-contenido"))).toBeNull();
    expect(detectImageType(Buffer.from("MZ\x90\x00 ejecutable windows"))).toBeNull();
    expect(detectImageType(Buffer.from("%PDF-1.7 documento"))).toBeNull();
  });

  it("rechaza vacios, muy cortos y valores que no son Buffer", () => {
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff]))).toBeNull();
    expect(detectImageType("ffd8ff")).toBeNull();
    expect(detectImageType(undefined)).toBeNull();
  });
});

describe("maxImageBytes", () => {
  const original = process.env.ADJUNTO_MAX_BYTES;
  afterEach(() => {
    if (original === undefined) delete process.env.ADJUNTO_MAX_BYTES;
    else process.env.ADJUNTO_MAX_BYTES = original;
  });

  it("3 MB por defecto y configurable por entorno", () => {
    delete process.env.ADJUNTO_MAX_BYTES;
    expect(maxImageBytes()).toBe(3 * 1024 * 1024);
    process.env.ADJUNTO_MAX_BYTES = "500000";
    expect(maxImageBytes()).toBe(500000);
    process.env.ADJUNTO_MAX_BYTES = "no-es-numero";
    expect(maxImageBytes()).toBe(3 * 1024 * 1024);
  });
});

describe("sha256Hex", () => {
  it("devuelve 64 hex y es determinista", () => {
    expect(sha256Hex(jpeg)).toMatch(/^[0-9a-f]{64}$/);
    expect(sha256Hex(jpeg)).toBe(sha256Hex(Buffer.from(jpeg)));
    expect(sha256Hex(jpeg)).not.toBe(sha256Hex(png));
  });
});
