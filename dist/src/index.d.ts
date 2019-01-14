import { JSONSchema6 } from 'json-schema';
import { Options as PrettierOptions } from 'prettier';
import { Options as $RefOptions } from 'json-schema-ref-parser';
export { EnumJSONSchema, JSONSchema, NamedEnumJSONSchema, CustomTypeJSONSchema } from './types/JSONSchema';
export interface Options {
    /**
     * Disclaimer comment prepended to the top of each generated file.
     */
    bannerComment: string;
    /**
     * Root directory for resolving [`$ref`](https://tools.ietf.org/id/draft-pbryan-zyp-json-ref-03.html)s.
     */
    cwd: string;
    /**
     * Declare external schemas referenced via `$ref`?
     */
    declareExternallyReferenced: boolean;
    /**
     * Prepend enums with [`const`](https://www.typescriptlang.org/docs/handbook/enums.html#computed-and-constant-members)?
     */
    enableConstEnums: boolean;
    /**
     * A [Prettier](https://prettier.io/docs/en/options.html) configuration.
     */
    style: PrettierOptions;
    /**
     * Generate code for `definitions` that aren't referenced by the schema?
     */
    unreachableDefinitions: boolean;
    /**
     * [$RefParser](https://github.com/BigstickCarpet/json-schema-ref-parser) Options, used when resolving `$ref`s
     */
    $refOptions: $RefOptions;
}
export declare const DEFAULT_OPTIONS: Options;
export declare function compileFromFile(filename: string, options?: Partial<Options>): Promise<string>;
export declare function compile(schema: JSONSchema6, name: string, options?: Partial<Options>): Promise<string>;
export declare class ValidationError extends Error {
}
