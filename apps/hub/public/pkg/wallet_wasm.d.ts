/* tslint:disable */
/* eslint-disable */

/**
 * Generate a keypair from a seed (deterministic)
 * 
 * Uses SHA256 hash of the seed to generate a deterministic keypair
 */
export function generate_keypair_from_seed(seed: string): string;

/**
 * Generate a random keypair (for testing)
 */
export function generate_random_keypair(): string;

/**
 * Get address from keypair JSON
 */
export function get_address_from_keypair(keypair_json: string): string;

export function greet(name: string): void;

/**
 * Initialize panic hook for better error messages
 */
export function init(): void;

/**
 * Sign a message with a keypair
 */
export function sign_message(keypair_json: string, message: Uint8Array): string;

/**
 * Verify a signature
 */
export function verify_signature(public_key_hex: string, message: Uint8Array, signature_hex: string): boolean;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly generate_keypair_from_seed: (a: number, b: number) => [number, number, number, number];
  readonly generate_random_keypair: () => [number, number, number, number];
  readonly get_address_from_keypair: (a: number, b: number) => [number, number, number, number];
  readonly greet: (a: number, b: number) => void;
  readonly init: () => void;
  readonly sign_message: (a: number, b: number, c: number, d: number) => [number, number, number, number];
  readonly verify_signature: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
