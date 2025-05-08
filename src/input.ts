import { encodeString, makeUint8Array } from "./utils.ts";

export type BufferLike = ArrayBuffer | string | ArrayBufferView | Blob;
export type StreamLike = ReadableStream<Uint8Array> | AsyncIterable<BufferLike>;
export type ZipFileDescription = {
    modDate: Date;
    bytes: ReadableStream<Uint8Array> | Uint8Array | Promise<Uint8Array>;
    crc?: number; // will be computed later
    mode: number; // UNIX permissions, 0o664 by default
    isFile: true;
};
export type ZipFolderDescription = {
    modDate: Date;
    mode: number; // UNIX permissions, 0o775 by default
    isFile: false;
};
export type ZipEntryDescription = ZipFileDescription | ZipFolderDescription;

/** The file name and modification date will be read from the input if it is a File or Response;
 * extra arguments can be given to override the input's metadata.
 * For other types of input, the `name` is required and `modDate` will default to *now*.
 * @param modDate should be a Date or timestamp or anything else that works in `new Date()`
 */
export function normalizeInput(input: File | Response | BufferLike | StreamLike, modDate?: unknown, mode?: number): ZipFileDescription;
export function normalizeInput(input: undefined, modDate?: unknown, mode?: number): ZipFolderDescription;
export function normalizeInput(input?: File | Response | BufferLike | StreamLike, modDate?: unknown, mode?: number): ZipEntryDescription {
    const effectiveModDate = modDate !== undefined && !(modDate instanceof Date) ? new Date(modDate as unknown as string) : modDate;

    const isFile = input !== undefined;

    const effectiveMode = mode || (isFile ? 0o664 : 0o775);
    if (input instanceof File) {
        return {
            isFile,
            modDate: (effectiveModDate as Date) || new Date(input.lastModified),
            bytes: input.stream(),
            mode: effectiveMode
        };
    }
    if (input instanceof Response) {
        // Response.body is nullable, but we know it exists in this context
        const body = input.body || new ReadableStream();
        return {
            isFile,
            modDate: (effectiveModDate as Date) || new Date(input.headers.get("Last-Modified") || Date.now()),
            bytes: body,
            mode: effectiveMode
        };
    }

    const finalModDate = effectiveModDate === undefined ? new Date() : effectiveModDate;
    if (Number.isNaN(finalModDate)) {
        throw new Error("Invalid modification date.");
    }

    if (!isFile) {
        return {
            isFile: false,
            modDate: finalModDate as Date,
            mode: effectiveMode
        };
    }
    if (typeof input === "string") {
        return {
            isFile,
            modDate: finalModDate as Date,
            bytes: encodeString(input),
            mode: effectiveMode
        };
    }
    if (input instanceof Blob) {
        return {
            isFile,
            modDate: finalModDate as Date,
            bytes: input.stream(),
            mode: effectiveMode
        };
    }
    if (input instanceof Uint8Array || input instanceof ReadableStream) {
        return {
            isFile,
            modDate: finalModDate as Date,
            bytes: input,
            mode: effectiveMode
        };
    }
    if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
        return {
            isFile,
            modDate: finalModDate as Date,
            bytes: makeUint8Array(input),
            mode: effectiveMode
        };
    }
    if (Symbol.asyncIterator in input) {
        return {
            isFile,
            modDate: finalModDate as Date,
            bytes: ReadableFromIterator(input[Symbol.asyncIterator]()),
            mode: effectiveMode
        };
    }
    throw new TypeError("Unsupported input format.");
}
export function ReadableFromIterator<T extends BufferLike>(iter: AsyncIterator<T>, upstream: AsyncIterator<unknown> = iter) {
    return new ReadableStream<Uint8Array>({
        async pull(controller) {
            let pushedSize = 0;
            // Use a default value of 0 if desiredSize is null
            const desiredSize = controller.desiredSize ?? 0;
            while (desiredSize > pushedSize) {
                const next = await iter.next();
                if (next.value) {
                    let chunkToEnqueue: Uint8Array;
                    if (next.value instanceof Blob) {
                        chunkToEnqueue = new Uint8Array(await next.value.arrayBuffer());
                    } else {
                        // The type assertion is safe here because Blob is handled above.
                        chunkToEnqueue = normalizeChunk(next.value as Exclude<BufferLike, Blob>);
                    }
                    controller.enqueue(chunkToEnqueue);
                    pushedSize += chunkToEnqueue.byteLength;
                } else {
                    controller.close();
                    break;
                }
            }
        },
        cancel(err) {
            upstream.throw?.(err);
        }
    });
}

export function normalizeChunk(chunk: Exclude<BufferLike, Blob>): Uint8Array {
    if (typeof chunk === "string") return encodeString(chunk);
    if (chunk instanceof Uint8Array) return chunk;
    // At this point, chunk is ArrayBuffer or ArrayBufferView (but not Uint8Array or Blob)
    return makeUint8Array(chunk as ArrayBuffer | ArrayBufferView);
}
