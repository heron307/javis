import { motion } from 'framer-motion'

export function HudRing() {
  return (
    <div className="hud-ring-wrap">
      <svg className="hud-ring-svg" viewBox="0 0 400 400" fill="none" aria-hidden>
        {/* Outer dashed ring */}
        <motion.circle
          cx="200"
          cy="200"
          r="185"
          stroke="rgba(0,229,255,0.25)"
          strokeWidth="1"
          strokeDasharray="4 8"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '200px 200px' }}
        />

        {/* Outer segmented ring */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '200px 200px' }}
        >
          <circle
            cx="200"
            cy="200"
            r="165"
            stroke="rgba(0,229,255,0.5)"
            strokeWidth="1.5"
            strokeDasharray="40 12 8 12 20 12"
          />
          {[0, 60, 120, 180, 240, 300].map((deg) => {
            const rad = (deg * Math.PI) / 180
            const x = 200 + 165 * Math.cos(rad)
            const y = 200 + 165 * Math.sin(rad)
            return (
              <circle key={deg} cx={x} cy={y} r="2.5" fill="#00e5ff" opacity="0.8" />
            )
          })}
        </motion.g>

        {/* Mid ring with ticks */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '200px 200px' }}
        >
          <circle
            cx="200"
            cy="200"
            r="130"
            stroke="rgba(0,229,255,0.35)"
            strokeWidth="1"
            strokeDasharray="2 6"
          />
          {Array.from({ length: 48 }).map((_, i) => {
            const deg = (i * 360) / 48
            const rad = (deg * Math.PI) / 180
            const outer = 145
            const inner = i % 4 === 0 ? 135 : 140
            return (
              <line
                key={i}
                x1={200 + outer * Math.cos(rad)}
                y1={200 + outer * Math.sin(rad)}
                x2={200 + inner * Math.cos(rad)}
                y2={200 + inner * Math.sin(rad)}
                stroke="#00e5ff"
                strokeWidth={i % 4 === 0 ? 1.5 : 0.8}
                opacity={i % 4 === 0 ? 0.7 : 0.35}
              />
            )
          })}
        </motion.g>

        {/* Inner arc segments */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '200px 200px' }}
        >
          <circle
            cx="200"
            cy="200"
            r="100"
            stroke="#00e5ff"
            strokeWidth="2"
            strokeDasharray="80 40 30 40 60 40"
            opacity="0.7"
          />
          <circle
            cx="200"
            cy="200"
            r="88"
            stroke="rgba(0,229,255,0.3)"
            strokeWidth="8"
            strokeDasharray="30 50 20 50"
            strokeLinecap="butt"
          />
        </motion.g>

        {/* Core rings */}
        <circle cx="200" cy="200" r="70" stroke="rgba(0,229,255,0.4)" strokeWidth="1" />
        <motion.circle
          cx="200"
          cy="200"
          r="55"
          stroke="#00e5ff"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '200px 200px' }}
          opacity="0.6"
        />

        {/* Core glow */}
        <circle cx="200" cy="200" r="40" fill="rgba(0,229,255,0.06)" />
        <circle cx="200" cy="200" r="28" stroke="rgba(0,229,255,0.5)" strokeWidth="1" />
        <motion.circle
          cx="200"
          cy="200"
          r="18"
          fill="rgba(0,229,255,0.15)"
          stroke="#00e5ff"
          strokeWidth="1.5"
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '200px 200px' }}
        />

        {/* Crosshair */}
        <line x1="200" y1="155" x2="200" y2="165" stroke="#00e5ff" strokeWidth="1" opacity="0.5" />
        <line x1="200" y1="235" x2="200" y2="245" stroke="#00e5ff" strokeWidth="1" opacity="0.5" />
        <line x1="155" y1="200" x2="165" y2="200" stroke="#00e5ff" strokeWidth="1" opacity="0.5" />
        <line x1="235" y1="200" x2="245" y2="200" stroke="#00e5ff" strokeWidth="1" opacity="0.5" />

        {/* Corner brackets */}
        <path d="M50 80 L50 50 L80 50" stroke="rgba(0,229,255,0.4)" strokeWidth="1" fill="none" />
        <path d="M350 80 L350 50 L320 50" stroke="rgba(0,229,255,0.4)" strokeWidth="1" fill="none" />
        <path d="M50 320 L50 350 L80 350" stroke="rgba(0,229,255,0.4)" strokeWidth="1" fill="none" />
        <path d="M350 320 L350 350 L320 350" stroke="rgba(0,229,255,0.4)" strokeWidth="1" fill="none" />
      </svg>

      <div className="hud-ring-center">
        <div className="hud-ring-center-label glow-text">J.A.V.I.S.</div>
        <div className="hud-ring-center-sub">SYSTEM ONLINE</div>
      </div>

      {/* Floating data chips */}
      <motion.div
        className="data-chip"
        style={{ top: '8%', left: '0%' }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        LAT <strong>37.5665</strong>
      </motion.div>
      <motion.div
        className="data-chip"
        style={{ top: '18%', right: '0%' }}
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
      >
        LNG <strong>126.9780</strong>
      </motion.div>
      <motion.div
        className="data-chip"
        style={{ bottom: '22%', left: '-2%' }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
      >
        DEST <strong>12</strong>
      </motion.div>
      <motion.div
        className="data-chip"
        style={{ bottom: '12%', right: '2%' }}
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 4.5, repeat: Infinity, delay: 0.8 }}
      >
        FX <strong>ACTIVE</strong>
      </motion.div>
    </div>
  )
}
