
    import { build } from "jsr:@deno/dnt";

    // Keep npm/node_modules between builds so dnt's npm install is a quick no-op
    for (const dir of ["esm", "script", "src"]) {
      await Deno.remove("./npm/" + dir, { recursive: true }).catch(() => {});
    }

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
      test: false,
      package: {"name":"thunder-sdk","version":"0.0.1","license":"MIT"},
    });
    