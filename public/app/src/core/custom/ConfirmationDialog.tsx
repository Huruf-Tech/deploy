import React, { type HTMLProps } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import type {
  ComponentRenderFn,
  DialogRootActions,
  DialogTriggerState,
} from "@base-ui/react";

type ConfirmationDialogBase = {
  trigger:
    | React.ReactElement<
      unknown,
      string | React.JSXElementConstructor<unknown>
    >
    | ComponentRenderFn<HTMLProps<unknown>, DialogTriggerState>
    | undefined;
  title?: React.ReactNode;
  description?: React.ReactNode;
  confirmText?: React.ReactNode;
  confirmingText?: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
};

type ConfirmationDialogProps =
  | (ConfirmationDialogBase & { type?: "normal"; hint?: never; inputLabel?: never; inputPlaceholder?: never; onConfirm: (dismiss: () => void) => void | Promise<void> })
  | (ConfirmationDialogBase & { type: "strict"; hint: string; inputLabel?: never; inputPlaceholder?: never; onConfirm: (dismiss: () => void) => void | Promise<void> })
  | (ConfirmationDialogBase & { type: "input"; hint?: never; inputLabel?: string; inputPlaceholder?: string; onConfirm: (value: string, dismiss: () => void) => void | Promise<void> });

export const ConfirmationDialog = (props: ConfirmationDialogProps) => {
  const { t } = useTranslation();
  const sheetRef = React.useRef<DialogRootActions>(null);
  const [value, setValue] = React.useState("");
  const [isConfirming, setIsConfirming] = React.useState(false);
  const type = props.type ?? "normal";

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      if (props.type === "input") {
        await props.onConfirm(value, () => sheetRef.current!.close());
      } else {
        await props.onConfirm(() => sheetRef.current!.close());
      }
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Sheet
      actionsRef={sheetRef}
      onOpenChange={(value) => {
        if (!value) setValue("");
      }}
    >
      <SheetTrigger render={props.trigger}></SheetTrigger>
      <SheetContent side="bottom" className="mx-auto mb-2 max-w-sm rounded-2xl">
        <SheetHeader>
          <SheetTitle className="text-xl">{props.title ?? t("Confirmation")}</SheetTitle>
          <SheetDescription>
            {props.description ?? t("Are you sure you want to do this action?")}
          </SheetDescription>
        </SheetHeader>

        {type === "strict" || type === "input"
          ? (
            <FieldGroup className="px-5">
              <Field>
                <FieldLabel>
                  {type === "strict" ? t("Type {{hint}} to confirm the action.", {
                    hint: props.hint,
                  }) : props.inputLabel ? t(props.inputLabel) : t("Input")}
                </FieldLabel>
                <Input
                  placeholder={type === "strict" ? t("Hint here...") : props.inputPlaceholder ? t(props.inputPlaceholder) : t("Enter value...")}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
                {type === "strict" && value && value !== props.hint && (
                  <FieldError>{t("please type a correct hint!")}</FieldError>
                )}
              </Field>
            </FieldGroup>
          )
          : null}
        <SheetFooter>
          <Button
            className="w-full"
            variant={props.variant}
            disabled={(type === "strict" && value !== props.hint) || (type === "input" && !value.trim()) || isConfirming}
            onClick={handleConfirm}
          >
            {isConfirming && props.confirmingText ? props.confirmingText : (props.confirmText ?? t("Confirm"))}
          </Button>
          <Button variant="outline" onClick={() => sheetRef.current!.close()}>
            {t("Dismiss")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};