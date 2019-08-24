import { Compiler, compilation as compilationType } from 'webpack';

type Compilation = compilationType.Compilation;

interface PluginInterface {
  filename: string;
  apply(compiler: Compiler): void;
}

interface Filelist {
  [name: string]: string[];
}

interface CompilationWithAssets extends Compilation {
  assets: Assets;
}

interface Assets {
  [name: string]: FilelistAssets;
}

interface FilelistAssets {
  source(): string;
  size(): number;
}

interface Validators {
  [name: string]: Validator;
}

interface Validator {
  (filename: string): boolean
}

interface Options {
  /* 
    Name of output file with .json at the end 

    default: filelist.json
  */
  filename?: string;

  /*
    Object containing named functions.
    Functions names map sections names.

    These functions get filenames and define whether to accept
    this filename to this section or not.

    Unaccepted filenames will be placed
    in 'rest' section.

    default: null
  */
  validators?: Validators | null;
}

// https://github.com/sindresorhus/is-plain-obj/blob/97480673cf12145b32ec2ee924980d66572e8a86/index.js
function isPlainObject(value: unknown): boolean {
    if (Object.prototype.toString.call(value) !== '[object Object]') {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === null || prototype === Object.getPrototypeOf({});
}

class BuildWebpackPlugin implements PluginInterface {
  private readonly validators: Validators | null;
  filename: string;

  constructor(options: Options = {}) {
    if (isPlainObject(options) === false) {
      throw new Error('build-webpack-plugin accepts only options objects');
    }

    if (options.filename) {
      this.filename = options.filename;
    } else {
      this.filename = 'filelist.json';
    }

    if (options.validators) {
      this.validators = options.validators;
    } else {
      this.validators = null;
    }
  }

  apply(compiler: Compiler): void {
    compiler.hooks.emit.tapAsync(
      'build-webpack-plugin', 
      (compilation: CompilationWithAssets, callback) => {
        const filelist: Filelist = {
          rest: [],
        };

        if (this.validators === null) {
          Object.keys(compilation.assets).forEach(filename => {
            filelist.rest = filelist.rest.concat(filename);
          });
        } else {
          const sections = Object.keys(this.validators) as string[];

          sections.forEach(sectionName => {
            filelist[sectionName] = []
          });

          Object.keys(compilation.assets).forEach(filename => {
            const matchedSection: string | undefined = sections.find(sectionName => (
              this.validators![sectionName](filename)
            ));

            if (matchedSection !== undefined) {
              filelist[matchedSection] = filelist[matchedSection].concat(filename);
            } else {
              filelist.rest = filelist.rest.concat(filename);
            }
          });
        }


        const jsonFilelist = JSON.stringify(filelist);
        compilation.assets[this.filename] = {
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

  Validators,
  Validator,
  Options,

  PluginInterface,
  Filelist,
  Compilation,
  CompilationWithAssets,
  FilelistAssets,
};