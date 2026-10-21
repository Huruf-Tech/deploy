import { PlusIcon, Trash2Icon } from "lucide-react";
import {
  Controller,
  type SubmitHandler,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import useSWRImmutable from "swr/immutable";
import { ThunderSDK } from "thunder-sdk";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/components/ui/combobox";
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
import { Spinner } from "@/components/ui/spinner";
import { formatDateForInput, getInitials } from "@/lib/utils";
import { ScopesInput } from "../ScopesInput";

export type TApiKey = Awaited<
  ReturnType<typeof ThunderSDK.apiKeys.get>
>["results"][number];

type TKeyForm = {
  name: string;
  scopes: string[];
  expiresAt: string;
  /** Tenant-specific scopes, edited as a list and sent as a record. */
  resourceGrant: { tenantId: string; scopes: string[] }[];
};

/** API key secrets look like `sk-<uuid>`. */
export const generateApiKeySecret = () => `sk-${crypto.randomUUID()}`;

export function KeyDialog({
  open,
  apiKey,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  apiKey?: TApiKey | null;
  onOpenChange: (open: boolean) => void;
  /** Receives the secret when a new key is created. */
  onSaved: (secret?: string) => void;
}) {
  const { t } = useTranslation();

  const { control, register, handleSubmit, formState, reset, watch } =
    useForm<TKeyForm>({
      values: {
        name: apiKey?.name ?? "",
        scopes: apiKey?.scopes ?? [],
        expiresAt: formatDateForInput(apiKey?.expiresAt),
        resourceGrant: Object.entries(apiKey?.resourceGrant ?? {}).map(
          ([tenantId, scopes]) => ({ tenantId, scopes }),
        ),
      },
    });
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "resourceGrant",
  });
  const advanced = fields.length > 0;
  const grants = watch("resourceGrant");

  const { data: tenants, isLoading: loadingTenants } = useSWRImmutable(
    advanced ? "tenants" : null,
    async () =>
      await ThunderSDK.tenants.get({ params: {}, query: { limit: 200 } }),
  );

  const close = () => {
    onOpenChange(false);
    reset();
  };

  const onSubmit: SubmitHandler<TKeyForm> = async (data) => {
    const body = {
      name: data.name.trim(),
      scopes: advanced ? [] : data.scopes,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      resourceGrant: Object.fromEntries(
        data.resourceGrant
          .filter((grant) => grant.tenantId)
          .map((grant) => [grant.tenantId, grant.scopes]),
      ),
    };

    try {
      if (apiKey) {
        await ThunderSDK.apiKeys.update({ params: { id: apiKey._id }, body });
        onSaved();
      } else {
        const secret = generateApiKeySecret();
        await ThunderSDK.apiKeys.create({ body: { ...body, secret } });
        onSaved(secret);
      }
      close();
    } catch (error) {
      console.error(error);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
    >
      <DialogPopup className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {apiKey ? t("Edit API key") : t("New API key")}
          </DialogTitle>
          <DialogDescription>
            {t("API keys let your servers call the API on your behalf.")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="contents">
          <DialogPanel>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="key-name">{t("Name")}</FieldLabel>
                <Input
                  id="key-name"
                  placeholder={t("e.g. Production server")}
                  aria-invalid={!!formState.errors.name || undefined}
                  {...register("name", {
                    validate: (value) =>
                      !!value.trim() || t("Name is required!"),
                  })}
                />
                <FieldError>{formState.errors.name?.message}</FieldError>
              </Field>

              {!advanced && (
                <Field>
                  <FieldLabel htmlFor="key-scopes">{t("Scopes")}</FieldLabel>
                  <Controller
                    name="scopes"
                    control={control}
                    rules={{
                      validate: (value) =>
                        advanced ||
                        value.length > 0 ||
                        t("Select at least one scope"),
                    }}
                    render={({ field, fieldState }) => (
                      <ScopesInput
                        id="key-scopes"
                        value={field.value}
                        onChange={field.onChange}
                        invalid={!!fieldState.error}
                      />
                    )}
                  />
                  <FieldError>{formState.errors.scopes?.message}</FieldError>
                </Field>
              )}

              <Field>
                <FieldLabel htmlFor="key-expires">{t("Expiration")}</FieldLabel>
                <Input
                  id="key-expires"
                  type="date"
                  min={formatDateForInput(tomorrow)}
                  aria-invalid={!!formState.errors.expiresAt || undefined}
                  {...register("expiresAt", {
                    validate: (value) =>
                      !value ||
                      new Date(value) > new Date() ||
                      t("Expiration date must be in the future"),
                  })}
                />
                <FieldError>{formState.errors.expiresAt?.message}</FieldError>
                <FieldDescription>
                  {t("Leave empty for a key that never expires.")}
                </FieldDescription>
              </Field>

              <Field orientation="horizontal" className="items-start">
                <Checkbox
                  id="key-advanced"
                  checked={advanced}
                  onCheckedChange={(checked) =>
                    checked ? append({ tenantId: "", scopes: [] }) : replace([])
                  }
                />
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="key-advanced">
                    {t("Tenant-specific scopes")}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {t(
                      "Grant different scopes per tenant instead of globally.",
                    )}
                  </span>
                </div>
              </Field>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t("Grant {{n}}", { n: index + 1 })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={t("Remove grant")}
                      onClick={() => remove(index)}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                  <Controller
                    name={`resourceGrant.${index}.tenantId`}
                    control={control}
                    rules={{ required: t("Select a tenant") }}
                    render={({ field: tenantField, fieldState }) => (
                      <Field>
                        <FieldLabel>{t("Tenant")}</FieldLabel>
                        <Combobox
                          items={(tenants?.results ?? []).filter(
                            (tenant) =>
                              tenant._id === tenantField.value ||
                              !grants.some((g) => g.tenantId === tenant._id),
                          )}
                          itemToStringLabel={(tenant) => tenant?.name ?? ""}
                          itemToStringValue={(tenant) => tenant?._id ?? ""}
                          value={
                            tenants?.results.find(
                              (x) => x._id === tenantField.value,
                            ) ?? null
                          }
                          onValueChange={(tenant) =>
                            tenantField.onChange(tenant?._id ?? "")
                          }
                        >
                          <ComboboxInput
                            placeholder={t("Select tenant…")}
                            startAddon={
                              loadingTenants ? <Spinner /> : undefined
                            }
                            aria-invalid={!!fieldState.error || undefined}
                          />
                          <ComboboxPopup>
                            <ComboboxEmpty>
                              {t("No tenants found.")}
                            </ComboboxEmpty>
                            <ComboboxList>
                              {(tenant: {
                                _id: string;
                                name: string;
                                logo?: string;
                              }) => (
                                <ComboboxItem key={tenant._id} value={tenant}>
                                  <Avatar className="size-6 rounded-md">
                                    {tenant.logo && (
                                      <AvatarImage src={tenant.logo} />
                                    )}
                                    <AvatarFallback className="rounded-md text-[10px]">
                                      {getInitials(tenant.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  {tenant.name}
                                </ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxPopup>
                        </Combobox>
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </Field>
                    )}
                  />
                  <Controller
                    name={`resourceGrant.${index}.scopes`}
                    control={control}
                    render={({ field: scopeField }) => (
                      <Field>
                        <FieldLabel>{t("Scopes")}</FieldLabel>
                        <ScopesInput
                          value={scopeField.value}
                          onChange={scopeField.onChange}
                        />
                      </Field>
                    )}
                  />
                </div>
              ))}

              {advanced && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => append({ tenantId: "", scopes: [] })}
                >
                  <PlusIcon />
                  {t("Add tenant")}
                </Button>
              )}
            </FieldGroup>
          </DialogPanel>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                formState.isSubmitting || (!!apiKey && !formState.isDirty)
              }
            >
              {formState.isSubmitting && <Spinner />}
              {apiKey ? t("Save changes") : t("Create key")}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
