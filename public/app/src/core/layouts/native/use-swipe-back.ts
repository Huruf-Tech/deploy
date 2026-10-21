import React from "react"
import { animate, useMotionValue, useReducedMotion } from "motion/react"
import { useNavigate } from "react-router"

/**
 * Edge-swipe to go back.
 *
 * The listeners go on the content pane itself, and a gesture only arms when the
 * finger lands within a narrow strip of the leading edge. The earlier shape of
 * this -- an absolutely positioned strip holding the listeners -- swallowed
 * every tap that landed in the first 28px of the screen, which is a row's
 * leading edge, a checkbox, an avatar. Nothing here declares `touch-action`, so
 * the browser is still free to claim a vertical drag as a scroll; when it does
 * it sends `pointercancel` and the gesture gives up, which is the right answer.
 *
 * While the finger is down the pane tracks it 1:1. On release the resting
 * position is *projected* from the release velocity rather than read off the
 * release point, so a short flick commits and a slow long drag that stops short
 * does not. Either way the spring that finishes the motion starts at the
 * finger's velocity, so there is no seam between dragging and animating.
 */

/** Width of the leading-edge strip that arms the gesture. */
const EDGE_WIDTH = 28

/** Travel before the gesture commits to a direction, so taps near the edge still tap. */
const THRESHOLD = 10

/** Fraction of the pane width the projected endpoint must pass to commit. */
const COMMIT_RATIO = 0.4

/** iOS scroll deceleration. 0.998 is the normal feel; 0.99 is snappier. */
const DECELERATION_RATE = 0.998

/** Where a flick at this velocity would come to rest, in px. */
function project(velocity: number) {
  return ((velocity / 1000) * DECELERATION_RATE) / (1 - DECELERATION_RATE)
}

type TGesture = {
  pointerId: number
  startX: number
  lastX: number
  lastTime: number
  velocity: number
  width: number
  committed: boolean
}

export function useSwipeBack(enabled: boolean) {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()

  /** Signed px the pane is offset by. Positive is rightwards, in either direction. */
  const x = useMotionValue(0)

  const gesture = React.useRef<TGesture | null>(null)

  /** A back swipe comes from whichever edge is "behind" the reading direction. */
  const direction = React.useCallback(
    () => (document.documentElement.dir === "rtl" ? -1 : 1),
    []
  )

  const settle = React.useCallback(
    (offset: number, velocity: number, width: number) => {
      const sign = direction()
      const travelled = offset * sign
      const projected = travelled + project(velocity * sign)

      if (projected > width * COMMIT_RATIO) {
        //! Bounce 0: the pane is leaving, and an overshoot past the screen edge
        //! would read as a glitch rather than momentum.
        void animate(x, sign * width, {
          type: "spring",
          bounce: 0,
          duration: 0.3,
          velocity,
        }).then(() => {
          //! `x.set` writes the transform straight to the DOM, outside React's
          //! render, so the reset lands in the same frame the new route commits
          //! in -- the outgoing page is never shown back at rest.
          navigate(-1)
          x.set(0)
        })

        return
      }

      // Cancelled: a little bounce is right here, the gesture carried momentum.
      void animate(x, 0, {
        type: "spring",
        bounce: 0.2,
        duration: 0.35,
        velocity,
      })
    },
    [direction, navigate, x]
  )

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!enabled || event.button !== 0) return

      const sign = direction()
      //! Measured against the pane, not the viewport: the pane is what moves,
      //! so it is also what the commit threshold should be a fraction of.
      const rect = event.currentTarget.getBoundingClientRect()
      const fromEdge =
        sign === 1 ? event.clientX - rect.left : rect.right - event.clientX

      if (fromEdge > EDGE_WIDTH) return

      gesture.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        lastX: event.clientX,
        lastTime: event.timeStamp,
        velocity: 0,
        width: rect.width,
        committed: false,
      }
    },
    [direction, enabled]
  )

  const onPointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const current = gesture.current
      if (!current || current.pointerId !== event.pointerId) return

      const delta = event.clientX - current.startX
      const sign = direction()

      if (!current.committed) {
        if (Math.abs(delta) < THRESHOLD) return
        // Pointing the wrong way: this was never a back swipe, let it go.
        if (delta * sign < 0) {
          gesture.current = null
          return
        }

        current.committed = true
        //! Capture keeps the moves coming once the finger leaves the strip,
        //! which it does immediately -- the strip is only 28px wide.
        event.currentTarget.setPointerCapture(event.pointerId)
      }

      const elapsed = event.timeStamp - current.lastTime
      if (elapsed > 0) {
        current.velocity = ((event.clientX - current.lastX) / elapsed) * 1000
        current.lastX = event.clientX
        current.lastTime = event.timeStamp
      }

      // Clamped at 0 so the pane cannot be dragged off the far side.
      x.set(delta * sign > 0 ? delta : 0)
    },
    [direction, x]
  )

  const onPointerUp = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const current = gesture.current
      if (!current || current.pointerId !== event.pointerId) return

      gesture.current = null

      if (!current.committed) return

      settle(x.get(), current.velocity, current.width)
    },
    [settle, x]
  )

  //! The browser claiming the drag as a scroll is not a release: there is no
  //! intent to commit, so the pane goes home regardless of how far it travelled.
  const onPointerCancel = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const current = gesture.current
      if (!current || current.pointerId !== event.pointerId) return

      gesture.current = null

      if (!current.committed) return

      void animate(x, 0, {
        type: "spring",
        bounce: 0,
        duration: 0.3,
        velocity: current.velocity,
      })
    },
    [x]
  )

  /** Spread onto the pane that should move. Null when the gesture does not apply. */
  const paneProps = enabled
    ? { onPointerDown, onPointerMove, onPointerUp, onPointerCancel }
    : undefined

  return {
    x,
    paneProps,
    /** Reduced motion still gets the gesture -- it is direct manipulation, not decoration. */
    prefersReducedMotion: !!prefersReducedMotion,
  }
}
