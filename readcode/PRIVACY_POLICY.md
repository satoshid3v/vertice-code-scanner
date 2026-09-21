# Privacy Policy

**Author:** Vertice Code

## 1. Data Collection (Zero Trust)
The "readcode" engine operates strictly on the client-side (Edge AI / WebAssembly). No video frames, image data, or barcode contents are transmitted to Vertice Code servers.

## 2. Camera Permissions
The engine requires explicit user consent to access device camera streams. Camera access is localized to the active browser tab and is immediately terminated upon component unmount.

## 3. Third-Party Integrations
In fallback mode, the engine dynamically loads WebAssembly binaries. However, all execution remains sandboxed within the local browser context.
