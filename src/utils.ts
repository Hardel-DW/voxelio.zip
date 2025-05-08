export const makeBuffer = (size: number) => new DataView(new ArrayBuffer(size));
export const makeUint8Array = (thing: ArrayBuffer | ArrayBufferView) => new Uint8Array(thing instanceof ArrayBuffer ? thing : thing.buffer);
export const encodeString = (whatever: unknown) => new TextEncoder().encode(String(whatever));
export const clampInt32 = (n: bigint) => Math.min(0xffffffff, Number(n));
export const clampInt16 = (n: bigint) => Math.min(0xffff, Number(n));
