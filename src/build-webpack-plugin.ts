import { Compiler, compilation as compilationType } from 'webpack';

type Compilation = compilationType.Compilation;

interface PluginInterface {
  apply(compiler: Compiler): void;
}

interface Filelist {
  assets: string[];
}

interface CompilationAssets extends Compilation {
  assets: Assets;
}

interface Assets {
  [name: string]: FilelistAssets;
}

interface FilelistAssets {
  source(): string;
  size(): number;
}

class BuildWebpackPlugin implements PluginInterface {
  apply(compiler: Compiler): void {
    compiler.hooks.emit.tapAsync(
      'build-webpack-plugin', 
      (compilation: CompilationAssets, callback) => {
        const filelist: Filelist = {
          assets: [],
        };

        Object.keys(compilation.assets).forEach(filename => {
          filelist.assets = filelist.assets.concat([filename]);
        });

        const jsonFilelist = JSON.stringify(filelist);
        compilation.assets['filelist.json'] = {
          source(): string {
            return jsonFilelist;
          },
          size(): number {
            return jsonFilelist.length;
          },
        }

        callback()
      }
    );
  }
}

export { 
  BuildWebpackPlugin,
  PluginInterface,
  Filelist,
  Compilation,
  CompilationAssets,
  FilelistAssets,
};