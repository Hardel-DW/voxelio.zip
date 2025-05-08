// ZIP structure constants
const fileHeaderSignature = 0x504b_0304;
const fileHeaderLength = 30;
const centralHeaderSignature = 0x504b_0102;
const centralHeaderLength = 46;
const zip64endRecordSignature = 0x504b_0606;
const zip64endLocatorSignature = 0x504b_0607;

// Compression methods
const COMPRESSION_STORED = 0;
const COMPRESSION_DEFLATE = 8;

/**
 * Extracts files from a ZIP using a Uint8Array.
 * @param data The ZIP file content as a Uint8Array
 * @returns An object containing file paths and their contents
 */
export async function extractZip(data: Uint8Array): Promise<Record<string, Uint8Array>> {
    const files: Record<string, Uint8Array> = {};
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    // Find the location of the "End of Central Directory Record"
    const endOfCentralDirIndex = findEndOfCentralDirectory(data);
    if (endOfCentralDirIndex === -1) {
        throw new Error("Invalid ZIP file: End of Central Directory Record not found");
    }

    // Read the number of files and the central directory offset
    const centralDirEntries = view.getUint16(endOfCentralDirIndex + 10, true);
    let centralDirOffset = view.getUint32(endOfCentralDirIndex + 16, true);

    // Check if this is a ZIP64 file
    if (centralDirOffset === 0xffffffff) {
        // Look for ZIP64 End of Central Directory Locator
        const zip64LocatorIndex = endOfCentralDirIndex - 20; // Fixed size

        if (view.getUint32(zip64LocatorIndex) === zip64endLocatorSignature) {
            // Find the location of the ZIP64 End of Central Directory Record
            const zip64EndOfCentralDirOffset = Number(view.getBigUint64(zip64LocatorIndex + 8, true));

            if (view.getUint32(zip64EndOfCentralDirOffset) === zip64endRecordSignature) {
                // Read the central directory offset from the ZIP64 record
                centralDirOffset = Number(view.getBigUint64(zip64EndOfCentralDirOffset + 48, true));
            }
        }
    }

    // Iterate through the central directory
    let offset = centralDirOffset;
    for (let i = 0; i < centralDirEntries; i++) {
        // Verify the central header signature
        if (view.getUint32(offset) !== centralHeaderSignature) {
            throw new Error(`Invalid central directory header at offset ${offset}`);
        }

        // Read file information
        const fileNameLength = view.getUint16(offset + 28, true);
        const extraFieldLength = view.getUint16(offset + 30, true);
        const fileCommentLength = view.getUint16(offset + 32, true);

        const isUtf8 = (view.getUint16(offset + 8, true) & 0x0800) !== 0;

        // Read the file name
        const fileNameBytes = new Uint8Array(data.buffer, data.byteOffset + offset + 46, fileNameLength);
        const fileName = isUtf8 ? new TextDecoder("utf-8").decode(fileNameBytes) : new TextDecoder("ascii").decode(fileNameBytes);

        // Ignore directories (ending with '/')
        if (fileName.endsWith("/")) {
            offset += centralHeaderLength + fileNameLength + extraFieldLength + fileCommentLength;
            continue;
        }

        // Read the offset to the beginning of the file (local file header)
        let localHeaderOffset = view.getUint32(offset + 42, true);
        let uncompressedSize = view.getUint32(offset + 24, true);
        let compressedSize = view.getUint32(offset + 20, true);
        const compressionMethod = view.getUint16(offset + 10, true);

        // Check if ZIP64 is used for this file
        if (localHeaderOffset === 0xffffffff || uncompressedSize === 0xffffffff || compressedSize === 0xffffffff) {
            // Scan the extra fields to find ZIP64 information
            let extraOffset = offset + 46 + fileNameLength;
            const extraFieldsEnd = extraOffset + extraFieldLength;

            while (extraOffset < extraFieldsEnd) {
                const headerId = view.getUint16(extraOffset, true);
                const dataSize = view.getUint16(extraOffset + 2, true);

                if (headerId === 1) {
                    // ZIP64 extra field
                    let fieldOffset = extraOffset + 4;

                    // May contain uncompressedSize, compressedSize, localHeaderOffset in that order
                    // but only if the standard field is 0xFFFFFFFF
                    if (uncompressedSize === 0xffffffff && fieldOffset + 8 <= extraFieldsEnd) {
                        uncompressedSize = Number(view.getBigUint64(fieldOffset, true));
                        fieldOffset += 8;
                    }
                    if (compressedSize === 0xffffffff && fieldOffset + 8 <= extraFieldsEnd) {
                        compressedSize = Number(view.getBigUint64(fieldOffset, true));
                        fieldOffset += 8;
                    }
                    if (localHeaderOffset === 0xffffffff && fieldOffset + 8 <= extraFieldsEnd) {
                        localHeaderOffset = Number(view.getBigUint64(fieldOffset, true));
                    }

                    break;
                }

                extraOffset += 4 + dataSize;
            }
        }

        // Read the local header to get file details
        if (view.getUint32(localHeaderOffset) !== fileHeaderSignature) {
            throw new Error(`Invalid local file header at offset ${localHeaderOffset}`);
        }

        const localFileNameLength = view.getUint16(localHeaderOffset + 26, true);
        const localExtraFieldLength = view.getUint16(localHeaderOffset + 28, true);

        // Calculate the file data offset
        const fileDataOffset = localHeaderOffset + fileHeaderLength + localFileNameLength + localExtraFieldLength;

        // Read the data based on compression method
        if (compressionMethod === COMPRESSION_STORED) {
            // Storage (no compression)
            files[fileName] = new Uint8Array(data.buffer, data.byteOffset + fileDataOffset, uncompressedSize);
        } else if (compressionMethod === COMPRESSION_DEFLATE) {
            // DEFLATE
            const compressedData = new Uint8Array(data.buffer, data.byteOffset + fileDataOffset, compressedSize);

            try {
                // Use the DEFLATE decompression API available in browsers
                const inflatedData = await inflateData(compressedData);
                files[fileName] = inflatedData;
            } catch (error: unknown) {
                console.error(`Error decompressing ${fileName}:`, error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                throw new Error(`Failed to decompress ${fileName}: ${errorMessage}`);
            }
        } else {
            throw new Error(`Unsupported compression method: ${compressionMethod} for file ${fileName}`);
        }

        // Move to the next entry in the central directory
        offset += centralHeaderLength + fileNameLength + extraFieldLength + fileCommentLength;
    }

    return files;
}

/**
 * Decompresses data using the DEFLATE algorithm
 * @param compressedData The compressed data
 * @returns The decompressed data
 */
async function inflateData(compressedData: Uint8Array): Promise<Uint8Array> {
    // Use DecompressionStream (Web Streams API)
    if (typeof DecompressionStream !== "undefined") {
        const ds = new DecompressionStream("deflate-raw");
        const writer = ds.writable.getWriter();
        writer.write(compressedData);
        writer.close();

        const output = [];
        const reader = ds.readable.getReader();
        let totalSize = 0;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
                output.push(value);
                totalSize += value.length;
            }
        }

        // Concatenate the chunks
        const result = new Uint8Array(totalSize);
        let offset = 0;
        for (const chunk of output) {
            result.set(chunk, offset);
            offset += chunk.length;
        }

        return result;
    }
    // Provide an alternative if DecompressionStream is not available
    throw new Error("DecompressionStream is not available in this environment. DEFLATE decompression is not supported.");
}

/**
 * Finds the location of the "End of Central Directory Record"
 * @param data The ZIP data
 * @returns The index of the beginning of the record or -1 if not found
 */
function findEndOfCentralDirectory(data: Uint8Array): number {
    // The "End of Central Directory" is typically at the end of the file
    // but may be followed by a comment, so we need to search backward

    // Minimum size of a ZIP file with an empty file
    if (data.length < 22) {
        return -1;
    }

    // Search from the end, considering that the maximum comment is 65535 bytes
    const maxComment = 65535;
    const startPos = Math.max(0, data.length - maxComment - 22);

    for (let i = data.length - 22; i >= startPos; i--) {
        // Check the signature at this position
        if (data[i] === 0x50 && data[i + 1] === 0x4b && data[i + 2] === 0x05 && data[i + 3] === 0x06) {
            return i;
        }
    }

    return -1;
}
