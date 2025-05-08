# What is `client-zip` / `@voxelio/zip` ?

This project is a fork of [client-zip](https://github.com/Touffy/client-zip) but
with numerous modifications. I needed a new function that didn't exist in the
original project. And I didn't want to encroach on the original project, which
is why I forked it.

I specifically added a function that allows obtaining files from an existing
zip, which can be obtained in any way - in my case I wanted to get it from a
file input on a frontend site. I took the opportunity to clean up the code and
make it more tidy with Biome/Deno.

## Installation

```sh
pnpm i @voxelio/zip
```

## I invite you to read the various markdown files of the initial project for more information.

My feature is very specific and I think it's not relevant to PR to the official
repository, unless the author wishes it, or there is strong demand from the
community.

This repository passes the unit tests of the initial project, as well as my own.
I wanted to respect the style rules of the initial project:

- No dependencies (REALLY THANK YOU David Junger)
- A project with the lowest possible size without really seeking optimization to
  the max
- A project that doesn't necessarily support old browsers (IE11) etc...
- A TS project that uses modern imports. Not require.
- A fast execution project.

Note that this fork has not yet been tested on all browsers!!!!!

### TODO

I need to remember to remove my mock that comes from another project, for
something cleaner.

# Function for Read a Zip :

You can import the `extractZip` function from the package. The function returns
a promise that resolves to an object containing file paths as keys and their
contents as Uint8Arrays.

The parameter is a `Uint8Array` that contains the zip file. You can get it from
a file input or any other way. And transform it into a `Uint8Array` with the
`Uint8Array` class. e.g.

```ts
import { extractZip } from "@voxelio/zip";

const exempleInput = document.getElementById("file-input") as HTMLInputElement;
const files = await extractZip(
  new Uint8Array(await exempleInput.files[0].arrayBuffer()),
);
```

The function signature is the following : Parameter :

- `data`: The zip file content as a `Uint8Array`

Return :

- The object containing file paths as keys and their contents as `Uint8Arrays`

```ts
export declare function extractZip(
  data: Uint8Array,
): Promise<Record<string, Uint8Array>>;
```

Tricks to transform a Uint8Array to a Text or JSON :

```ts
const text = new TextDecoder().decode(data);
const json = JSON.parse(text);
```

# Function for Create a Zip :

You can import the `downloadZip` function from the package.

```ts
import { downloadZip } from "@voxelio/zip";
```

The function signature is the following :

```ts
function downloadZip(
  files: ForAwaitable<
    InputWithMeta | InputWithSizeMeta | InputWithoutMeta | InputFolder
  >,
  options?: Options,
): Response;
```

You can use the `downloadZip` function to create a zip file from a list of
files.

```ts
const zip = downloadZip([
  { name: "file.txt", content: "Hello, world!" },
]);
```

Or if your date is a `Uint8Array`, you can use a Simple Stream :

```ts
const exampleFile ... (In Uint8Array)

const foo = new ReadableStream({
  start(controller) {
    controller.enqueue(exampleFile);
    controller.close();
  },
});

const files: InputWithoutMeta[] = [{name: "foo.txt", input: foo}];

const zip = downloadZip(files);
```
