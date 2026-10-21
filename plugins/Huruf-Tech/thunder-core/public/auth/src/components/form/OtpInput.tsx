import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const slotClass =
  "*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:bg-background *:data-[slot=input-otp-slot]:text-xl *:data-[slot=input-otp-slot]:font-medium";

/** Six digit one-time code input. Calls `onComplete` once all digits are in. */
export function OtpInput({
  value,
  onChange,
  onComplete,
  invalid,
  disabled,
  id = "otp",
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <div dir="ltr" className="flex w-full justify-center">
      <InputOTP
        id={id}
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        value={value}
        onChange={onChange}
        onComplete={onComplete}
        disabled={disabled}
        aria-invalid={invalid || undefined}
      >
        <InputOTPGroup className={slotClass}>
          <InputOTPSlot index={0} aria-invalid={invalid || undefined} />
          <InputOTPSlot index={1} aria-invalid={invalid || undefined} />
          <InputOTPSlot index={2} aria-invalid={invalid || undefined} />
        </InputOTPGroup>
        <InputOTPSeparator className="mx-1.5 text-muted-foreground/50" />
        <InputOTPGroup className={slotClass}>
          <InputOTPSlot index={3} aria-invalid={invalid || undefined} />
          <InputOTPSlot index={4} aria-invalid={invalid || undefined} />
          <InputOTPSlot index={5} aria-invalid={invalid || undefined} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}
