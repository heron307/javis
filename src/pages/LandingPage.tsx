import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppShell } from '../components/AppShell'
import { HudRing } from '../components/HudRing'
import { Features } from '../components/Features'
import { Preview } from '../components/Preview'
import { Ticker } from '../components/Ticker'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  }),
}

export function LandingPage() {
  return (
    <AppShell>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <motion.p
              className="hero-eyebrow"
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              Journey Assistant Virtual Intelligence System
            </motion.p>

            <motion.h1
              className="hero-brand glow-text"
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              J.A.V.I.S<span>.</span>
            </motion.h1>

            <motion.p
              className="hero-tagline"
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              Travel Command Interface
            </motion.p>

            <motion.p
              className="hero-desc"
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              여행 기록부터 일정·예산·항공·환율·현지 인텔까지.
              당신의 개인 여행 어시스턴트가 모든 미션을 지원합니다.
            </motion.p>

            <motion.div
              className="hero-actions"
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              <Link to="/logs" className="btn-primary">
                Open Travel Log
              </Link>
              <a href="#modules" className="btn-ghost">
                View Modules
              </a>
            </motion.div>

            <motion.div
              className="hero-metrics"
              custom={5}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              <div className="metric">
                <span className="metric-value">05</span>
                <span className="metric-label">Active Modules</span>
              </div>
              <div className="metric">
                <span className="metric-value">∞</span>
                <span className="metric-label">Destinations</span>
              </div>
              <div className="metric">
                <span className="metric-value">LIVE</span>
                <span className="metric-label">FX · Flights</span>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            <HudRing />
          </motion.div>
        </div>
      </section>

      <Ticker />

      <Features />

      <Preview />

      <section className="cta" id="init">
        <div className="container">
          <div className="hud-panel cta-panel">
            <span className="hud-corner tl" />
            <span className="hud-corner tr" />
            <span className="hud-corner bl" />
            <span className="hud-corner br" />

            <p className="section-code">// READY FOR DEPLOYMENT</p>
            <h2 className="cta-title glow-text">시스템을 기동하시겠습니까?</h2>
            <p className="cta-desc">
              여행 미션을 시작하고, 기록·계획·인텔을 한곳에서 관리하세요.
            </p>
            <Link to="/logs" className="btn-primary">
              Boot Travel Log
            </Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <span className="footer-brand">J.A.V.I.S. · TRAVEL INTELLIGENCE</span>
          <span className="footer-copy">MODULE 01 · 05 ONLINE · LOG · GEO</span>
        </div>
      </footer>
    </AppShell>
  )
}
