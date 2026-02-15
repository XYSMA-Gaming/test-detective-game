interface RequireContext {
  keys(): string[];
  (key: string): any;
}

interface NodeRequire {
  context(
    directory: string,
    useSubdirectories?: boolean,
    regExp?: RegExp
  ): RequireContext;
}
