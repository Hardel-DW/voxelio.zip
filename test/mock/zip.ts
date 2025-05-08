import { DATA_DRIVEN_TEMPLATE_ENCHANTMENT } from "./datadriven.ts";
import { enchantplusTags, vanillaTags } from "./tags.ts";
import { Identifier } from "./Identifier.ts";

const enchantmentFiles = DATA_DRIVEN_TEMPLATE_ENCHANTMENT.reduce(
    (files, enchant) => {
        const filePath = new Identifier(enchant.identifier).toFilePath();
        files[filePath] = new TextEncoder().encode(
            JSON.stringify(enchant.data, null, 2),
        );
        return files;
    },
    {} as Record<string, Uint8Array>,
);

// Generate tag files from all sources
const tagFiles = [...enchantplusTags, ...vanillaTags].reduce(
    (files, tag) => {
        const filePath = new Identifier(tag.identifier).toFilePath();
        files[filePath] = new TextEncoder().encode(
            JSON.stringify(tag.data, null, 2),
        );
        return files;
    },
    {} as Record<string, Uint8Array>,
);

// Create mock files
export const filesRecord = {
    "pack.mcmeta": new TextEncoder().encode(
        JSON.stringify(
            { pack: { pack_format: 61, description: "lorem ipsum" } },
            null,
            2,
        ),
    ),
    ...enchantmentFiles,
    ...tagFiles,
};

export const filesRecordWithInvalidPackMcmeta = {
    ...filesRecord,
    "pack.mcmeta": new TextEncoder().encode(
        JSON.stringify({ pack: {} }, null, 2),
    ),
};

export const filesRecordWithoutPackMcmeta = {
    ...enchantmentFiles,
    ...tagFiles,
};
