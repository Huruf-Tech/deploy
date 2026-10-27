import { AddServerButton } from "./AddServerButton"
import { ClearCachesButton } from "./ClearCachesButton"
import { RentServerButton } from "@/pages/rentals/Rentals"

/** The servers list's actions: free disk, bring your own server, or rent one (PLAN §26.6). */
export function ServerActions() {
  return (
    <>
      <ClearCachesButton />
      <RentServerButton />
      <AddServerButton />
    </>
  )
}
