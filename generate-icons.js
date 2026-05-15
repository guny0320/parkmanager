// 아이콘 생성 스크립트 — npm 패키지 불필요 (Node.js 내장 모듈만 사용)
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// CRC32 테이블 (PNG 청크 무결성 검사용)
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  CRC_TABLE[n] = c;
}
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// 단색 PNG 생성
function createPNG(size, r, g, b) {
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB

  const row = 1 + size * 3;
  const raw = Buffer.alloc(size * row);
  for (let y = 0; y < size; y++) {
    raw[y * row] = 0; // filter None
    for (let x = 0; x < size; x++) {
      const o = y * row + 1 + x * 3;
      raw[o] = r; raw[o+1] = g; raw[o+2] = b;
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  function chunk(type, data) {
    const t = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, crcBuf]);
  }

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const dir = path.join(__dirname, 'icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// #1d4ed8 = rgb(29, 78, 216)
for (const size of [144, 152, 192, 512]) {
  fs.writeFileSync(path.join(dir, `icon-${size}x${size}.png`), createPNG(size, 29, 78, 216));
  console.log(`✅ icons/icon-${size}x${size}.png`);
}
console.log('\n아이콘 생성 완료! icons/ 폴더를 확인하세요.');
