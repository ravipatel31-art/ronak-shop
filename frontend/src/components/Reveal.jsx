import { motion, useReducedMotion } from 'motion/react'

/** Fade + rise reveal that respects prefers-reduced-motion. */
export default function Reveal({ children, delay = 0, y = 22, as = 'div', className, ...rest }) {
  const reduced = useReducedMotion()
  const MotionTag = motion[as] || motion.div

  return (
    <MotionTag
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={
        reduced
          ? { duration: 0.2, ease: 'easeOut' }
          : { type: 'spring', bounce: 0, duration: 0.6, delay, visualDuration: 0.4 }
      }
      {...rest}
    >
      {children}
    </MotionTag>
  )
}
