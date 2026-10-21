import { useTranslation } from "react-i18next";
import useSWRImmutable from "swr/immutable";
import { ThunderSDK } from "thunder-sdk";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxValue,
} from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";

/** Scopes every key/client can request, regardless of access policies. */
const BASE_SCOPES = ["full_access"];

/** Multi-select of scopes backed by the access control policies. */
export function ScopesInput({
  id,
  value,
  onChange,
  extraScopes = [],
  invalid,
}: {
  id?: string;
  value: string[];
  onChange: (value: string[]) => void;
  extraScopes?: string[];
  invalid?: boolean;
}) {
  const { t } = useTranslation();
  const { data: policies, isLoading } = useSWRImmutable(
    "accessControlPolicies",
    async () =>
      await ThunderSDK.accessControlPolicies.get({
        params: {},
        query: { limit: 200 },
      }),
  );

  const items = Array.from(
    new Set([
      ...BASE_SCOPES,
      ...extraScopes,
      ...(policies?.results ?? [])
        .map((policy) => policy.name)
        .filter((name) => name !== "root"),
      // Keep scopes that were saved before a policy was removed.
      ...value,
    ]),
  );

  return (
    <Combobox items={items} multiple value={value} onValueChange={onChange}>
      <ComboboxChips
        startAddon={isLoading ? <Spinner /> : null}
        aria-invalid={invalid || undefined}
      >
        <ComboboxValue>
          {(values: string[]) => (
            <>
              {values.map((scope) => (
                <ComboboxChip key={scope} aria-label={scope}>
                  {scope}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput
                id={id}
                placeholder={
                  values.length > 0 ? undefined : t("Select scopes…")
                }
                aria-label={t("Select scopes")}
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxPopup>
        <ComboboxEmpty>{t("No matching scopes.")}</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  );
}
