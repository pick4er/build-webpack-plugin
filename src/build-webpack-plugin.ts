import { Compiler, compilation as compilationType } from 'webpack';

type Compilation = compilationType.Compilation;

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

type Validator = (filename: string) => boolean;

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

class BuildWebpackPlugin {
  private readonly validators: Validators | null;
  private readonly filename: string;
  private readonly filelist: Filelist;
  private sections: string[];

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

    this.filelist = {
      rest: [],
    };

    this.sections = [];
  }

  apply(compiler: Compiler): void {
    compiler.hooks.emit.tapAsync(
      'build-webpack-plugin',
      (compilation: CompilationWithAssets, callback) => {
        this.divideFilelistOnSections();

        Object.keys(compilation.assets).forEach((filename) => {
          const matchedSection: string | undefined = this.findFilenameSection(
            filename,
          );
          this.addFilenameToFilelistSection(filename, matchedSection);
        });

        this.addFilelistToCompilation(compilation);
        callback();
      },
    );
  }

  public findFilenameSection(filename: string): string | undefined {
    return this.sections.find((sectionName) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.validators![sectionName](filename);
    });
  }

  private divideFilelistOnSections(): void {
    if (this.validators === null) return;

    if (this.sections.length === 0) {
      this.sections = Object.keys(this.validators);
    }

    this.sections.forEach((sectionName) => {
      this.filelist[sectionName] = [];
    });
  }

  private addFilenameToFilelistSection(
    filename: string,
    section: string | undefined,
  ): void {
    if (section !== undefined) {
      this.filelist[section] = this.filelist[section].concat(filename);
    } else {
      this.filelist.rest = this.filelist.rest.concat(filename);
    }
  }

  private addFilelistToCompilation(compilation: CompilationWithAssets): void {
    const jsonFilelist = JSON.stringify(this.filelist);
    // eslint-disable-next-line no-param-reassign
    compilation.assets[this.filename] = {
      source(): string {
        return jsonFilelist;
      },
      size(): number {
        return jsonFilelist.length;
      },
    };
  }
}

export { BuildWebpackPlugin };
