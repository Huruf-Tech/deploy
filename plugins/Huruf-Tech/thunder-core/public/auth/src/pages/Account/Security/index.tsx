import { useTranslation } from "react-i18next";
import { SectionHeader } from "@/components/Settings";
import { useCapabilities } from "@/hooks/useCapabilities";
import { features } from "@/lib/features";
import { ConnectedAccountsCard } from "./ConnectedAccountsCard";
import { DeviceSessions } from "./DeviceSessions";
import { PasskeysCard } from "./PasskeysCard";
import { PasswordCard } from "./PasswordCard";
import { TwoFactorCard } from "./TwoFactorCard";

function Security() {
  const { t } = useTranslation();
  const { has } = useCapabilities();

  return (
    <>
      <SectionHeader
        title={t("Security")}
        description={t(
          "Settings and recommendations to help keep your account secure.",
        )}
      />
      <PasswordCard />
      {has("passkey") && <PasskeysCard />}
      {has("2fa") && <TwoFactorCard />}
      {features.connectedAccounts && <ConnectedAccountsCard />}
      {features.deviceSessions && <DeviceSessions />}
    </>
  );
}

export default Security;
