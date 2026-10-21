
    import { build, emptyDir } from "jsr:@deno/dnt";

    await emptyDir("./npm");

    await build({
      entryPoints: [
        "./index.ts", 
        {
          name: "./base",
          path: "./base.ts",
        },
        {
          name: "./types",
          path: "./types.ts",
        }
      ],
      outDir: "./npm",
      shims: {
        // see JS docs for overview and more options
        deno: true,
      },
      package: {"name":"thunder-sdk","version":"0.0.1","license":"MIT"},
    });
    