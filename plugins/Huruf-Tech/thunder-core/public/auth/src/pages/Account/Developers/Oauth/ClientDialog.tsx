import { PlusIcon, XIcon } from "lucide-react";
import React from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ThunderSDK } from "thunder-sdk";
import { ImageUpload } from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Radio, RadioGroup } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useAppBranding } from "@/hooks/useAppBranding";
import { authClient } from "@/lib/auth";
import { generateSecret, getInitials } from "@/lib/utils";
import { ScopesInput } from "../ScopesInput";

export type TOAuthClient = Awaited<
  ReturnType<typeof ThunderSDK.oauthClients.get>
>["results"][number];

type TClientForm = {
  name: string;
  description: string;
  logo: string | null;
  type: "public" | "confidential";
  allowedScopes: string[];
  redirectUris: string[];
};

const CLIENT_TYPES = [
  {
    value: "public",
    title: "Public",
    description: "Single-page or mobile apps that can't keep a secret.",
  },
  {
    value: "confidential",
    title: "Confidential",
    description: "Server-side apps that can store a client secret securely.",
  },
] as const;

function isValidRedirectUri(value: string) {
  try {
    const url = new URL(value);
    // Custom schemes (myapp://callback) are valid for native apps.
    return (
      !["javascript:", "data:", "vbscript:"].includes(url.protocol) && !url.hash
    );
  } catch {
    return false;
  }
}

export function ClientDialog({
  open,
  client,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  /** Edit this client; create a new one when omitted. */
  client?: TOAuthClient | null;
  onOpenChange: (open: boolean) => void;
  /** Receives the generated secret when a confidential client is created. */
  onSaved: (secret?: string) => void;
}) {
  const { t } = useTranslation();
  const { appName } = useAppBranding();
  const { data: session } = authClient.useSession();
  const [uriDraft, setUriDraft] = React.useState("");
  const [uriError, setUriError] = React.useState<string>();

  const { control, register, handleSubmit, formState, reset, watch, setValue } =
    useForm<TClientForm>({
      values: {
        name: client?.name ?? "",
        description: client?.description ?? "",
        logo: client?.logo ?? null,
        type: client?.type ?? "public",
        allowedScopes: client?.allowedScopes ?? ["full_access"],
        redirectUris: client?.redirectUris ?? [],
      },
    });

  const redirectUris = watch("redirectUris");
  const name = watch("name");

  const close = () => {
    onOpenChange(false);
    setUriDraft("");
    setUriError(undefined);
    reset();
  };

  const addRedirectUri = () => {
    const value = uriDraft.trim();
    if (!value) return true;

    if (!isValidRedirectUri(value)) {
      setUriError(t("Enter a full URL, e.g. https://myapp.com/callback"));
      return false;
    }

    if (!redirectUris.includes(value))
      setValue("redirectUris", [...redirectUris, value], {
        shouldDirty: true,
        shouldValidate: true,
      });
    setUriDraft("");
    setUriError(undefined);
    return true;
  };

  const onSubmit: SubmitHandler<TClientForm> = async (data) => {
    // Don't lose a URI that was typed but not added yet.
    const pending = uriDraft.trim();
    if (pending && !addRedirectUri()) return;
    const uris =
      pending && !data.redirectUris.includes(pending)
        ? [...data.redirectUris, pending]
        : data.redirectUris;

    const body = {
      name: data.name.trim(),
      description: data.description.trim() || undefined,
      logo: data.logo ?? undefined,
      type: data.type,
      allowedScopes: data.allowedScopes,
      redirectUris: uris,
    };

    try {
      if (client) {
        await ThunderSDK.oauthClients.update({
          params: { id: client._id },
          body,
        });
        onSaved();
      } else {
        const secret =
          data.type === "confidential" ? generateSecret(48) : undefined;
        await ThunderSDK.oauthClients.create({ body: { ...body, secret } });
        onSaved(secret);
      }
      close();
    } catch (error) {
      // The SDK interceptor already surfaced the error.
      console.error(error);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
    >
      <DialogPopup className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {client ? t("Edit OAuth app") : t("New OAuth app")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "Let your applications sign users in with their {{name}} account.",
              {
                name: appName,
              },
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="contents">
          <DialogPanel>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel>{t("Logo")}</FieldLabel>
                <Controller
                  name="logo"
                  control={control}
                  render={({ field }) => (
                    <ImageUpload
                      shape="square"
                      value={field.value}
                      onChange={(url) => field.onChange(url)}
                      path={[session?.user.id ?? "anonymous", "oauthClient"]}
                      fallback={
                        name ? (
                          <span className="font-semibold">
                            {getInitials(name)}
                          </span>
                        ) : undefined
                      }
                    />
                  )}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="client-name">{t("App name")}</FieldLabel>
                <Input
                  id="client-name"
                  placeholder={t("e.g. My Application")}
                  aria-invalid={!!formState.errors.name || undefined}
                  {...register("name", {
                    validate: (value) =>
                      !!value.trim() || t("App name is required!"),
                  })}
                />
                <FieldError>{formState.errors.name?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="client-description">
                  {t("Description")}
                </FieldLabel>
                <Textarea
                  id="client-description"
                  rows={2}
                  placeholder={t("Shown to users on the consent screen")}
                  {...register("description")}
                />
              </Field>

              <Field>
                <FieldLabel>{t("App type")}</FieldLabel>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid gap-2 sm:grid-cols-2"
                      disabled={!!client}
                    >
                      {CLIENT_TYPES.map((type) => (
                        <Label
                          key={type.value}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 font-normal transition-colors hover:bg-accent/50 has-data-checked:border-primary/60 has-data-checked:bg-primary/4 has-data-disabled:cursor-not-allowed has-data-disabled:opacity-70"
                        >
                          <Radio value={type.value} className="mt-0.5" />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">
                              {t(type.title)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {t(type.description)}
                            </span>
                          </div>
                        </Label>
                      ))}
                    </RadioGroup>
                  )}
                />
                {client && (
                  <FieldDescription>
                    {t("The app type can't be changed after creation.")}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="client-scopes">
                  {t("Allowed scopes")}
                </FieldLabel>
                <Controller
                  name="allowedScopes"
                  control={control}
                  rules={{
                    validate: (value) =>
                      value.length > 0 || t("Select at least one scope"),
                  }}
                  render={({ field, fieldState }) => (
                    <ScopesInput
                      id="client-scopes"
                      value={field.value}
                      onChange={field.onChange}
                      extraScopes={["offline_access"]}
                      invalid={!!fieldState.error}
                    />
                  )}
                />
                <FieldError>
                  {formState.errors.allowedScopes?.message}
                </FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="client-redirect">
                  {t("Redirect URIs")}
                </FieldLabel>
                <Controller
                  name="redirectUris"
                  control={control}
                  rules={{
                    validate: (value) =>
                      value.length > 0 ||
                      !!uriDraft.trim() ||
                      t("Add at least one redirect URI"),
                  }}
                  render={() => (
                    <div className="flex gap-2">
                      <Input
                        id="client-redirect"
                        type="url"
                        inputMode="url"
                        placeholder="https://myapp.com/auth/callback"
                        value={uriDraft}
                        aria-invalid={!!uriError || undefined}
                        onChange={(e) => {
                          setUriDraft(e.target.value);
                          setUriError(undefined);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addRedirectUri();
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={t("Add redirect URI")}
                        onClick={addRedirectUri}
                      >
                        <PlusIcon />
                      </Button>
                    </div>
                  )}
                />
                <FieldError>
                  {uriError ?? formState.errors.redirectUris?.message}
                </FieldError>
                {redirectUris.length > 0 && (
                  <ul className="flex flex-col divide-y rounded-lg border">
                    {redirectUris.map((uri) => (
                      <li
                        key={uri}
                        className="flex items-center gap-2 py-1 ps-3 pe-1"
                      >
                        <code className="flex-1 truncate font-mono text-xs">
                          {uri}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={t("Remove {{value}}", { value: uri })}
                          onClick={() =>
                            setValue(
                              "redirectUris",
                              redirectUris.filter((u) => u !== uri),
                              { shouldDirty: true, shouldValidate: true },
                            )
                          }
                        >
                          <XIcon />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <FieldDescription>
                  {t(
                    "Users are only sent back to these exact URLs after signing in.",
                  )}
                </FieldDescription>
              </Field>
            </FieldGroup>
          </DialogPanel>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                formState.isSubmitting ||
                (!!client && !formState.isDirty && !uriDraft)
              }
            >
              {formState.isSubmitting && <Spinner />}
              {client ? t("Save changes") : t("Create app")}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
