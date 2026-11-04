# Vendored libraries (loaded as local scripts; no CDN, no runtime fetch)

| File | Library | Version | License | Use |
|---|---|---|---|---|
| `qrcodegen.min.js` | Project Nayuki QR Code generator (TypeScript) | upstream `qrcodegen.ts`, compiled with tsc (es2017) + terser | MIT (full notice kept at the top of the file; source in `qrcodegen.src.ts`) | Encodes each binary frame (byte mode, ECC M) and the accept code |
| `jsQR.min.js` | jsQR by cozmo | 1.4.0 (`dist/jsQR.js`, re-minified with terser) | Apache-2.0 (`LICENSE-jsQR-Apache-2.0.txt`) | Decodes frames from the simulated viewfinder or the real camera |

Copied unchanged from the design sandbox v2 `vendor/`. No other third-party code.
