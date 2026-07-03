import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { TYPE_CLASSES, translateType } from '@/lib/constants';
import { isTrustedSpriteUrl } from '@/lib/utils';

const CLOSABLE_PHASES = new Set(['reveal', 'error']);
const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function CaptureModal({
  showModal,
  modalPhase,
  captured,
  currentGoal,
  t,
  lang,
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

        {(modalPhase === 'shaking' || modalPhase === 'opening') && (
          <div className="captureStage" aria-hidden="true">
            <div className={`pokeballAnim${modalPhase === 'opening' ? ' pokeballOpening' : ''}`}>
              <div className="pbaTop" />
              <div className="pbaBand"><div className="pbaBtn" /></div>
              <div className="pbaBottom" />
            </div>
          </div>
        )}

        {modalPhase === 'error' && (
          <div className="captureError">
            <span className="captureErrorIcon" aria-hidden="true">📡</span>
            <h2 className="modalTitle" id="capture-title">{t.captureErrorTitle}</h2>
            <p className="captureErrorMsg">{t.captureErrorMsg}</p>
          </div>
        )}

        {modalPhase === 'reveal' && captured && (
          <div className="pokemonReveal">
            <div className="revealGlow" aria-hidden="true" />
            {isTrustedSpriteUrl(captured.sprite) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="pokemonSprite" src={captured.sprite} alt={captured.name} width={160} height={160} decoding="async" />
            )}
            <span className="revealNumber">#{String(captured.id).padStart(3, '0')}</span>
            <h3 className="revealName">{captured.name}</h3>
            <div className="revealTypes">
              {captured.types.map(tp => (
                <span key={tp} className={`typeBadge ${TYPE_CLASSES[tp] || ''}`}>{translateType(tp, lang)}</span>
              ))}
            </div>
            <div className="capturedBanner">{t.capturedBanner}</div>
          </div>
        )}

        {CLOSABLE_PHASES.has(modalPhase) && (
          <motion.button
            ref={closeBtnRef}
            className="ctrlBtn ctrlBtnPrimary"
            onClick={closeModal}
            style={{ width: '100%' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {modalPhase === 'error' ? t.btnClose : t.btnContinueModal}
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
