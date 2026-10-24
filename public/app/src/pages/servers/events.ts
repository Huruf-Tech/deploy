/** Lets the list toolbar's "Add server" tell the card view to refresh. */
const serverEvents = new EventTarget()

export const notifyServersChanged = () =>
  serverEvents.dispatchEvent(new Event("changed"))

export const onServersChanged = (listener: () => void) => {
  serverEvents.addEventListener("changed", listener)
  return () => serverEvents.removeEventListener("changed", listener)
}

/**
 * Whether an "Add server" dialog is open. While the list is empty, core's
 * list page swaps its toolbar (and the empty state) for skeletons on every
 * refetch, which would unmount the dialog: the cards hold off until it closes.
 */
let addServerOpen = false
export const isAddServerOpen = () => addServerOpen
export const setAddServerOpen = (open: boolean) => {
  addServerOpen = open
}
