import QRCodeStyling from "qr-code-styling";
import React from "react";

/**
 * Renders `value` as a QR code. Always dark-on-white: authenticator apps
 * struggle to scan inverted codes, so it ignores the active color scheme.
 */
export function QRCode({
  value,
  size = 184,
}: {
  value: string;
  size?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [qr] = React.useState(
    () =>
      new QRCodeStyling({
        width: size,
        height: size,
        type: "svg",
        margin: 0,
        dotsOptions: { type: "rounded", color: "#0b0b0f" },
        cornersSquareOptions: { type: "extra-rounded", color: "#0b0b0f" },
        cornersDotOptions: { type: "dot", color: "#0b0b0f" },
        backgroundOptions: { color: "#ffffff" },
      }),
  );

  React.useEffect(() => {
    if (!ref.current) return;
    ref.current.replaceChildren();
    qr.append(ref.current);
  }, [qr]);

  React.useEffect(() => {
    qr.update({ data: value });
  }, [qr, value]);

  return (
    <div className="rounded-2xl bg-white p-3 shadow-xs ring-1 ring-black/5">
      <div ref={ref} style={{ width: size, height: size }} />
    </div>
  );
}
