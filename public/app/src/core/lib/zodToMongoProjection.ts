import z from "zod";

export type MongoProjection = Record<string, 1>;

type ZodDef = {
    type: string;
    shape?: Record<string, z.ZodType>;
    element?: z.ZodType;
    innerType?: z.ZodType;
    valueType?: z.ZodType;
    getter?: () => z.ZodType;
};

function getDef(schema: z.ZodType): ZodDef {
    return (schema as unknown as { _zod: { def: ZodDef } })._zod.def;
}

/**
 * Walks a Zod schema and produces a MongoDB projection object where every leaf
 * field maps to `1`. Nested objects are flattened using dot notation
 * (e.g. `metadata.foo`) and arrays project their element fields without an
 * index segment (e.g. `posts.title`).
 */
export function zodToMongoProjection(schema: z.ZodType): MongoProjection {
    const projection: MongoProjection = {};

    const visit = (node: z.ZodType, path: string): void => {
        const def = getDef(node);

        switch (def.type) {
            // Unwrap modifiers that wrap an inner schema without changing the path.
            case "optional":
            case "nullable":
            case "default":
            case "catch":
            case "readonly":
            case "nonoptional":
            case "prefault": {
                if (def.innerType) visit(def.innerType, path);
                return;
            }

            case "lazy": {
                if (def.getter) visit(def.getter(), path);
                return;
            }

            case "object": {
                const shape = def.shape ?? {};
                for (const key of Object.keys(shape)) {
                    const nextPath = path ? `${path}.${key}` : key;
                    visit(shape[key], nextPath);
                }
                return;
            }

            case "array": {
                // Arrays keep the same path; an array of objects flattens its element's
                // fields, while an array of scalars projects the array field itself.
                if (def.element) visit(def.element, path);
                return;
            }

            default: {
                // Any leaf (string, number, boolean, enum, date, etc.) projects to 1.
                if (path) projection[path] = 1;
                return;
            }
        }
    };

    visit(schema, "");

    return projection;
}
