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
