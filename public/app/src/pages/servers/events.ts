/** Lets the list toolbar's "Add server" tell the card view to refresh. */
const serverEvents = new EventTarget()

export const notifyServersChanged = () =>
  serverEvents.dispatchEvent(new Event("changed"))

export const onServersChanged = (listener: () => void) => {
  serverEvents.addEventListener("changed", listener)
  return () => serverEvents.removeEventListener("changed", listener)
}
