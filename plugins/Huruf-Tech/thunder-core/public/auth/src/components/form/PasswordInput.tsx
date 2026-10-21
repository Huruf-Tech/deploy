import { EyeIcon, EyeOffIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

/** Password field with a show / hide toggle. Forwards everything to the input. */
export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<typeof InputGroupInput>, "type" | "className"> & {
  className?: string;
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = React.useState(false);

  return (
    <InputGroup className={className}>
      <InputGroupInput
        size="lg"
        type={visible ? "text" : "password"}
        autoComplete="current-password"
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={visible ? t("Hide password") : t("Show password")}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
