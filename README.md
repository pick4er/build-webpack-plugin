This is the plugin that can emit a file containing
json object about webpack built files.

Ones can split output files by their names
in this object.

### To build sources

- run `npm run build` (Ubuntu only so far)
- then `import { BuildWebpackPlugin } from 'dist/build-webpack-plugin'`

### Accepts following config:

- **filename**: string, output filename with extension (default filelist.json)
- **validators**: object of named functions, that accept filenames and returns true / false, depending on validation
