import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

function patchLeafletDoubleTap() {
  const patchedModule = path.resolve(
    __dirname,
    "./src/vendor/leaflet/DomEvent.DoubleTap.js",
  )

  return {
    name: "patch-leaflet-double-tap",
    enforce: "pre",
    resolveId(source, importer) {
      const normalizedImporter = importer?.split(path.sep).join("/")
      if (
        (source === "./DomEvent.DoubleTap" ||
          source === "./DomEvent.DoubleTap.js") &&
        normalizedImporter?.endsWith("/node_modules/leaflet/src/dom/DomEvent.js")
      ) {
        return patchedModule
      }
      return null
    },
  }
}

export default defineConfig({
  plugins: [patchLeafletDoubleTap(), react()],
  assetsInclude: ['**/*.geojson'],
  base: '/',
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      {
        find: /^leaflet$/,
        replacement: path.resolve(__dirname, "./node_modules/leaflet/src/Leaflet.js"),
      },
    ],
  },
  optimizeDeps: {
    exclude: ["leaflet"],
    esbuildOptions: {
      sourcemap: false,
    },
  },
})
