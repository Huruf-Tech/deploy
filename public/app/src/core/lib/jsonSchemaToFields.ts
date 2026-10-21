import type { TFilters } from "thunder-sdk/types"

export const FieldTypes = [
  "text",
  "number",
  "boolean",
  "date",
  "email",
  "url",
  "hidden",
  "phone",
] as const

export type TFieldType = (typeof FieldTypes)[number]
export type TField = {
  type: TFieldType | "integer" | "array" | "object"
  group?: string
  groupClassName?: string
  className?: string
  groupStyle?: React.CSSProperties
  style?: React.CSSProperties
  fields?: Array<TField>
  name?: string
  parentName?: string
  defaultValue?: unknown
  label?: string
  placeholder?: string
  description?: string
  multi?: boolean
  minLength?: number
  maxLength?: number
  minItems?: number
  maxItems?: number
  minimum?: number
  maximum?: number
  required?: string[]
  optional?: boolean
  enum?: string[] | Array<{ label: string; value: unknown }>
  pattern?: string
  example?: string
  ref?: string
  refFilters?: TFilters;
  refLabel?: string | string[]
  refValue?: string
  fieldHint?: string
  const?: unknown
  canFilter?: boolean
  requirementKey?: string
  fileType?: string
  fileSize?: number
  filterSchema?: string
  ignoreQueryValue?: boolean
  queryValue?: string
}

/** A JSON Schema node. Schemas are open records, so every key is permitted. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSchema = Record<string, any>

/** Threaded through the recursion so `$ref` can be resolved against the root. */
type TSchemaContext = {
  root: TSchema
  refs: Set<string>
}

export class JSONSchemaToFields {
  /**
   * Schemas are plain JSON Schema documents, so every node is an open record.
   */
  protected static warned = new Set<string>()

  /** Set to true to silence unsupported-construct warnings. */
  static silent = false

  protected static warn(message: string) {
    if (this.silent || this.warned.has(message)) return

    this.warned.add(message)

    console.warn(`[JSONSchemaToFields] ${message}`)
  }

  protected static resolveFieldType(type: string, format?: string): TFieldType {
    switch (format) {
      case "uri": {
        return "url"
      }

      case "date":
      case "date-time": {
        return "date"
      }

      case "email": {
        return "email"
      }

      case "e164": {
        return "phone"
      }

      default: {
        return FieldTypes.includes(type as TFieldType)
          ? (type as TFieldType)
          : type === "integer"
            ? "number"
            : "text"
      }
    }
  }

  /**
   * Reads a node's `type`, tolerating the union form JSON Schema allows
   * (`type: ["string", "null"]`, which is what a nullable field compiles to).
   * The first non-null member wins.
   */
  protected static readType(schema: TSchema): string {
    const type = schema.type

    if (Array.isArray(type)) {
      return type.find((entry) => entry !== "null") ?? "string"
    }

    return typeof type === "string" ? type : "string"
  }

  /** Resolves a local JSON Pointer ref (`#/$defs/Address`) against the root. */
  protected static resolvePointer(
    ref: string,
    ctx: TSchemaContext
  ): TSchema | undefined {
    if (!ref.startsWith("#")) {
      this.warn(`Cannot resolve external $ref "${ref}" — rendered as text.`)
      return
    }

    let node: unknown = ctx.root

    for (const segment of ref.slice(1).split("/").filter(Boolean)) {
      const key = segment.replace(/~1/g, "/").replace(/~0/g, "~")

      node = (node as TSchema | undefined)?.[key]

      if (node === undefined) {
        this.warn(`Could not resolve $ref "${ref}" — rendered as text.`)
        return
      }
    }

    return typeof node === "object" && node !== null
      ? (node as TSchema)
      : undefined
  }

  /** Folds `allOf` members into the host schema (last member wins on conflict). */
  protected static mergeAllOf(
    schema: TSchema,
    members: unknown[],
    ctx: TSchemaContext,
    chain: Set<string>
  ): TSchema {
    const { allOf: _allOf, ...rest } = schema

    const merged: TSchema = { ...rest }
    const properties: TSchema = { ...(rest.properties ?? {}) }
    const required = new Set<string>(
      Array.isArray(rest.required) ? rest.required : []
    )

    for (const raw of members) {
      const member = this.normalize(raw, ctx, chain)

      if (!member) continue

      Object.assign(properties, member.properties ?? {})

      for (const key of member.required ?? []) required.add(key)

      for (const [key, value] of Object.entries(member)) {
        if (["properties", "required", "allOf"].includes(key)) continue

        merged[key] = value
      }
    }

    if (Object.keys(properties).length) {
      merged.type = "object"
      merged.properties = properties
    }

    if (required.size) merged.required = [...required]

    return merged
  }

  /**
   * Collapses `oneOf` / `anyOf` into something renderable.
   *
   * - `null` branches are dropped, so `z.nullable()` resolves to its real type.
   * - A single surviving branch is inlined losslessly.
   * - Several object branches are merged into one object; a property keeps
   *   `required` only if every branch requires it. This is a superset form:
   *   submittable, but it cannot express "these fields XOR those fields".
   *   Rendering only the selected variant is not implemented.
   * - Several scalar branches fall back to the first one's type.
   */
  protected static collapseUnion(
    schema: TSchema,
    branches: unknown[],
    keyword: "oneOf" | "anyOf",
    ctx: TSchemaContext,
    chain: Set<string>
  ): TSchema {
    const rest = { ...schema }
    delete rest[keyword]

    const resolved = branches
      .map((branch) => this.normalize(branch, ctx, chain))
      .filter((branch): branch is TSchema => !!branch)
      .filter((branch) => this.readTypeRaw(branch) !== "null")

    if (resolved.length === 0) return { ...rest, type: "string" }

    if (resolved.length === 1) return { ...rest, ...resolved[0] }

    const objects = resolved.filter(
      (branch) => branch.properties && typeof branch.properties === "object"
    )

    if (objects.length === resolved.length) {
      const properties: TSchema = { ...(rest.properties ?? {}) }

      for (const branch of objects) {
        Object.assign(properties, branch.properties)
      }

      //! The discriminator of a tagged union appears in every branch with a
      //! different `const`. Merging would keep only the last one, leaving the
      //! user no way to pick a variant, so collect the constants into an enum
      //! instead.
      for (const key of Object.keys(properties)) {
        const constants = objects
          .map((branch) => branch.properties?.[key])
          .filter((prop) => prop && prop.const !== undefined)
          .map((prop) => prop.const)

        const distinct = [...new Set(constants)]

        if (distinct.length > 1) {
          const { const: _const, ...prop } = properties[key]

          properties[key] = { ...prop, enum: distinct }
        }
      }

      // Required only where every branch agrees — otherwise a user picking one
      // variant would be blocked by another variant's mandatory fields.
      const required = (objects[0].required ?? []).filter((key: string) =>
        objects.every((branch) => (branch.required ?? []).includes(key))
      )

      this.warn(
        `${keyword} of objects was merged into a single form showing every variant's fields. ` +
          `Pick one variant's values; the others can be left blank.`
      )

      return {
        ...rest,
        type: "object",
        properties,
        ...(required.length ? { required } : {}),
      }
    }

    this.warn(
      `${keyword} of differing scalar types fell back to "${this.readType(resolved[0])}".`
    )

    return { ...rest, ...resolved[0] }
  }

  /** Raw `type` read used only to spot `null` union members. */
  protected static readTypeRaw(schema: TSchema): unknown {
    return schema.type
  }

  /**
   * Rewrites a schema node into the plain shape `_toFields` understands by
   * resolving `$ref` and folding `allOf` / `oneOf` / `anyOf`.
   */
  protected static normalize(
    schema: unknown,
    ctx: TSchemaContext,
    chain: Set<string> = new Set()
  ): TSchema | undefined {
    if (typeof schema !== "object" || schema === null) return

    let node = schema as TSchema

    if (typeof node.$ref === "string") {
      const ref = node.$ref
      const { $ref: _ref, ...siblings } = node

      //! Guards a pure resolution cycle (A -> B -> A). A ref that merely recurs
      //! deeper in the tree is handled by the stack kept in `_toFields`.
      if (chain.has(ref)) {
        this.warn(`Cyclic $ref "${ref}" — rendered as text.`)
        return { ...siblings, type: "string" }
      }

      const target = this.resolvePointer(ref, ctx)

      if (!target) return { ...siblings, type: "string" }

      chain.add(ref)

      const resolved = this.normalize({ ...target, ...siblings }, ctx, chain)

      chain.delete(ref)

      return resolved
    }

    if (Array.isArray(node.allOf)) {
      node = this.mergeAllOf(node, node.allOf, ctx, chain)
    }

    for (const keyword of ["oneOf", "anyOf"] as const) {
      if (Array.isArray(node[keyword])) {
        node = this.collapseUnion(node, node[keyword], keyword, ctx, chain)
      }
    }

    return node
  }

  protected static _toFields(
    name: string | undefined,
    schema: unknown,
    hints?: Partial<TField>,
    ctx?: TSchemaContext
  ): TField[] {
    if (typeof schema !== "object" || schema === null) {
      throw new Error("Cannot construct form fields from an invalid schema!")
    }

    const context: TSchemaContext = ctx ?? {
      root: schema as TSchema,
      refs: new Set(),
    }

    //! A `$ref` that reappears beneath itself (a tree/linked-list shape) would
    //! recurse forever, because resolving it yields the same node again. Keep it
    //! on a stack for the whole subtree so the nested occurrence stops.
    const followed =
      typeof (schema as TSchema).$ref === "string"
        ? ((schema as TSchema).$ref as string)
        : undefined

    if (followed && context.refs.has(followed)) {
      this.warn(
        `Recursive $ref "${followed}" — nested occurrence rendered as text.`
      )

      return [{ optional: true, ...hints, name, type: "text" } as TField]
    }

    if (followed) context.refs.add(followed)

    try {
      return this.buildFields(name, schema, hints, context)
    } finally {
      if (followed) context.refs.delete(followed)
    }
  }

  protected static buildFields(
    name: string | undefined,
    schema: unknown,
    hints: Partial<TField> | undefined,
    context: TSchemaContext
  ): TField[] {
    const node = this.normalize(schema, context)

    if (!node) {
      throw new Error("Cannot construct form fields from an invalid schema!")
    }

    const type = this.readType(node)

    //! JSON Schema default: a property is OPTIONAL unless its parent lists it in
    //! `required`. Callers pass `optional` down through hints; anything that
    //! arrives without it is optional, never mandatory.
    const base: Partial<TField> = {
      optional: true,
      ...hints,
      ...(node.default !== undefined ? { defaultValue: node.default } : {}),
    }

    if (
      type === "object" &&
      typeof node.properties === "object" &&
      node.properties !== null
    ) {
      const required: string[] = Array.isArray(node.required)
        ? node.required
        : []

      return [
        {
          ...base,
          ...node,
          name,
          type: "object",
          optional: base.optional,
          fields: Object.entries(node.properties).flatMap(([prop, def]) =>
            this._toFields(
              prop,
              def,
              { parentName: name, optional: !required.includes(prop) },
              context
            )
          ),
        },
      ]
    }

    //! An object with no `properties` but an `additionalProperties` schema is a
    //! dictionary/record. There is no per-key UI for that, so it is edited as
    //! JSON rather than silently rendered as a one-line text box.
    if (
      type === "object" &&
      node.additionalProperties !== undefined &&
      node.additionalProperties !== false
    ) {
      return [
        {
          name,
          type: "text",
          fieldHint: "json",
          ...base,
          ...node,
        },
      ]
    }

    if (type === "array") {
      const items = this.normalize(node.items, context)

      if (items) {
        if (["object", "array"].includes(this.readType(items))) {
          return [
            {
              ...base,
              ...node,
              name,
              type: "array",
              optional: base.optional,
              fields: this._toFields(
                undefined,
                items,
                { parentName: name },
                context
              ),
            },
          ]
        }

        return this._toFields(
          name,
          items,
          { ...base, ...node, multi: true },
          context
        )
      }

      if (Array.isArray(node.prefixItems)) {
        return node.prefixItems.flatMap((entry: unknown, index: number) =>
          this._toFields(
            `${name}.${index}`,
            entry,
            { ...base, parentName: name },
            context
          )
        )
      }
    }

    if (type === "object") {
      this.warn(
        `Object field "${name ?? "(root)"}" has no properties — skipped.`
      )
    }

    const field = {
      ...base,
      ...node,
      name,
      type: this.resolveFieldType(
        type,
        typeof node.format === "string" ? node.format : undefined
      ),
    }

    return [field as TField]
  }

  static resolveRef?: (
    ref: string,
    field: TField
  ) => Promise<Array<{ label: string; value: unknown }>>

  protected static async resolveField(field: TField): Promise<TField> {
    if (typeof field.ref === "string") {
      if (typeof this.resolveRef !== "function") {
        throw new Error("Unable to resolve reference! No implementation!")
      }

      field.enum = await this.resolveRef(field.ref, field)
    }

    return field
  }

  protected static async resolveDeepFields(
    fields: TField[]
  ): Promise<TField[]> {
    return await Promise.all(
      fields.map(async (field) => {
        if (["array", "object"].includes(field.type)) {
          field.fields = await this.resolveDeepFields(field.fields ?? [])
        }

        return await this.resolveField(field)
      })
    )
  }

  static async toFields(
    name: string | undefined,
    schema: unknown,
    opts?: {
      resolveRef?: boolean
    }
  ): Promise<TField[]> {
    const fields = this._toFields(name, schema, undefined, {
      root: (schema ?? {}) as TSchema,
      refs: new Set(),
    })

    if (!opts?.resolveRef) return fields

    return await this.resolveDeepFields(fields)
  }

  static flatten(
    fields: TField[],
    opts?: {
      parentName?: string
      excludeArray?: boolean
    }
  ): TField[] {
    return fields.flatMap((field) => {
      if (opts?.excludeArray && field.type === "array") return []

      if (field.fields instanceof Array && field.fields.length) {
        return this.flatten(field.fields, {
          ...opts,
          parentName: [
            opts?.parentName,
            field.name,
            field.type === "array" ? "0" : undefined,
          ]
            .filter(Boolean)
            .join("."),
        })
      }

      delete field.parentName

      field.name = [opts?.parentName, field.name].filter(Boolean).join(".")

      return field
    })
  }
}
