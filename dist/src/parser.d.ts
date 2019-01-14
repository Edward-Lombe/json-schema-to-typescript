import { JSONSchema6Type } from 'json-schema';
import { Options } from './';
import { AST } from './types/AST';
import { JSONSchema } from './types/JSONSchema';
export declare type Processed = Map<JSONSchema | JSONSchema6Type, AST>;
export declare type UsedNames = Set<string>;
export declare function parse(schema: JSONSchema | JSONSchema6Type, options: Options, rootSchema?: JSONSchema, keyName?: string, isSchema?: boolean, processed?: Processed, usedNames?: Set<string>): AST;
