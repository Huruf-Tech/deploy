import { AddServerButton } from "./AddServerButton"
import { RentServerButton } from "@/pages/rentals/Rentals"

/** The servers list's actions: bring your own server, or rent one (PLAN §26.6). */
export function ServerActions() {
  return (
    <>
      <RentServerButton />
      <AddServerButton />
    </>
  )
}
