// wa-sqlite ships untyped ESM; declare the entry points we use as `any`.
declare module "wa-sqlite/dist/wa-sqlite-async.mjs" {
  const factory: () => Promise<unknown>;
  export default factory;
}
declare module "wa-sqlite" {
  export function Factory(module: unknown): unknown;
}
declare module "wa-sqlite/src/examples/OriginPrivateFileSystemVFS.js" {
  export class OriginPrivateFileSystemVFS {
    constructor();
    readonly name: string;
    close(): Promise<void>;
  }
}
