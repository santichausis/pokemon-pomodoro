import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TYPE_CLASSES, translateType } from '@/lib/constants';
import { isTrustedSpriteUrl } from '@/lib/utils';

const CLOSABLE_PHASES = new Set(['reveal', 'error']);
const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Pokéball entrance + shake + elastic "pop open" burst. Timing comes
// straight from these transitions (via onAnimationComplete in the
// component below) instead of hardcoded setTimeout durations that had to
// be kept in sync with separate CSS keyframes by hand.
const pokeballVariants = {
  shake: {
    scale: 1,
    rotate: [0, -12, 12, -9, 9, -5, 5, 0, -10, 10, -7, 7, -4, 4, 0],
    transition: {
      scale: { type: 'spring', stiffness: 280, damping: 14 },
      rotate: { duration: 1.7, ease: 'easeInOut', delay: 0.2 },
    },
  },
  open: {
    scale: [1, 1.35, 0],
    rotate: [0, 14, 26],
    opacity: [1, 0.85, 0],
    transition: { duration: 0.42, ease: 'easeOut' },
  },
};

// Reveal content cascades in one piece at a time — sprite pops first, then
// number/name/types/banner follow via staggerChildren.
const revealContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const revealItem = {
  hidden: { opacity: 0, y: 16, scale: 0.85 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 24 } },
};
const spritePop = {
  hidden: { opacity: 0, scale: 0.3 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 16 } },
};

export default function CaptureModal({
  showModal,
  modalPhase,
  captured,
  currentGoal,
  t,
  lang,
  onPhaseComplete,
  onRetry,
  closeModal,
}) {
  const closeBtnRef = useRef(null);
  const modalRef = useRef(null);

  // Focus something inside the modal on every phase change (so Tab always
  // starts trapped inside it, even during the shaking/opening animation
  // where there's nothing else focusable yet — Tab is a no-op there rather
  // than leaking focus to the page behind, since the container itself is
  // tabIndex=-1), and keep Tab/Shift+Tab from escaping to the page behind
  // the overlay. Escape/backdrop-click only dismiss once there's something
  // to see (reveal) or the fetch failed (error).
  useEffect(() => {
    if (!showModal) return;
    if (CLOSABLE_PHASES.has(modalPhase)) closeBtnRef.current?.focus();
    else modalRef.current?.focus();

    const onKey = e => {
      if (e.key === 'Escape' && CLOSABLE_PHASES.has(modalPhase)) { closeModal(); return; }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusables = modalRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusables.length === 0) { e.preventDefault(); return; }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showModal, modalPhase, closeModal]);

  if (!showModal) return null;

  // Only allow closing by clicking the backdrop once there's something to
  // dismiss, so the catch animation isn't interrupted mid-flight.
  const onOverlayClick = e => {
    if (CLOSABLE_PHASES.has(modalPhase) && e.target === e.currentTarget) closeModal();
  };

  return (
    <motion.div
      className="modalOverlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      onClick={onOverlayClick}
    >
      <motion.div
        ref={modalRef}
        className="modalCard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="capture-title"
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.7, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      >
        {modalPhase !== 'error' && (
          <div className="modalHeader">
            <p className="modalStars" aria-hidden="true">{t.modalStars}</p>
            <h2 className="modalTitle" id="capture-title">{t.modalTitle}</h2>
            <p className="modalGoal">&ldquo;{currentGoal}&rdquo;</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {(modalPhase === 'shaking' || modalPhase === 'opening') && (
            <motion.div key="capture-stage" className="captureStage" aria-hidden="true" exit={{ opacity: 0 }}>
              <motion.div
                className="pokeballAnim"
                initial={{ scale: 0, rotate: -30 }}
                animate={modalPhase === 'opening' ? 'open' : 'shake'}
                variants={pokeballVariants}
                onAnimationComplete={onPhaseComplete}
              >
                <div className="pbaTop" />
                <div className="pbaBand"><div className="pbaBtn" /></div>
                <div className="pbaBottom" />
              </motion.div>
            </motion.div>
          )}

          {modalPhase === 'error' && (
            <motion.div
              key="capture-error"
              className="captureError"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <span className="captureErrorIcon" aria-hidden="true">📡</span>
              <h2 className="modalTitle" id="capture-title">{t.captureErrorTitle}</h2>
              <p className="captureErrorMsg">{t.captureErrorMsg}</p>
            </motion.div>
          )}

          {modalPhase === 'reveal' && captured && (
            <motion.div key="capture-reveal" className="pokemonReveal" variants={revealContainer} initial="hidden" animate="show">
              <div className="revealGlow" aria-hidden="true" />
              {isTrustedSpriteUrl(captured.sprite) && (
                <motion.div className="pokemonSpriteWrap" variants={spritePop}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="pokemonSprite" src={captured.sprite} alt={captured.name} width={160} height={160} decoding="async" />
                </motion.div>
              )}
              <motion.span className="revealNumber" variants={revealItem}>#{String(captured.id).padStart(3, '0')}</motion.span>
              <motion.h3 className="revealName" variants={revealItem}>{captured.name}</motion.h3>
              <motion.div className="revealTypes" variants={revealContainer}>
                {captured.types.map(tp => (
                  <motion.span key={tp} variants={revealItem} className={`typeBadge ${TYPE_CLASSES[tp] || ''}`}>
                    {translateType(tp, lang)}
                  </motion.span>
                ))}
              </motion.div>
              <motion.div className="capturedBanner" variants={revealItem}>{t.capturedBanner}</motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {modalPhase === 'error' && (
          <div className="controlsRow">
            <motion.button
              className="ctrlBtn ctrlBtnSecondary"
              onClick={closeModal}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {t.btnClose}
            </motion.button>
            <motion.button
              ref={closeBtnRef}
              className="ctrlBtn ctrlBtnPrimary"
              onClick={onRetry}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {t.btnRetry}
            </motion.button>
          </div>
        )}

        {modalPhase === 'reveal' && (
          <motion.button
            ref={closeBtnRef}
            className="ctrlBtn ctrlBtnPrimary"
            onClick={closeModal}
            style={{ width: '100%' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {t.btnContinueModal}
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
