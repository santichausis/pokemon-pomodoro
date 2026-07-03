import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { TYPE_CLASSES, translateType } from '@/lib/constants';

export default function CaptureModal({
  showModal,
  modalPhase,
  captured,
  currentGoal,
  t,
  lang,
  closeModal,
}) {
  const continueRef = useRef(null);

  // Once the catch is revealed, move focus to the continue button and
  // let Escape dismiss the dialog.
  useEffect(() => {
    if (!showModal || modalPhase !== 'reveal') return;
    continueRef.current?.focus();
    const onKey = e => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showModal, modalPhase, closeModal]);

  if (!showModal) return null;

  // Only allow closing by clicking the backdrop after the reveal,
  // so the catch animation isn't interrupted.
  const onOverlayClick = e => {
    if (modalPhase === 'reveal' && e.target === e.currentTarget) closeModal();
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
        className="modalCard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="capture-title"
        initial={{ opacity: 0, scale: 0.7, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      >
        <div className="modalHeader">
          <p className="modalStars" aria-hidden="true">{t.modalStars}</p>
          <h2 className="modalTitle" id="capture-title">{t.modalTitle}</h2>
          <p className="modalGoal">&ldquo;{currentGoal}&rdquo;</p>
        </div>

        {(modalPhase === 'shaking' || modalPhase === 'opening') && (
          <div className="captureStage" aria-hidden="true">
            <div className={`pokeballAnim${modalPhase === 'opening' ? ' pokeballOpening' : ''}`}>
              <div className="pbaTop" />
              <div className="pbaBand"><div className="pbaBtn" /></div>
              <div className="pbaBottom" />
            </div>
          </div>
        )}

        {modalPhase === 'reveal' && captured && (
          <div className="pokemonReveal">
            <div className="revealGlow" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="pokemonSprite" src={captured.sprite} alt={captured.name} width={160} height={160} decoding="async" />
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

        {modalPhase === 'reveal' && (
          <motion.button
            ref={continueRef}
            className="ctrlBtn ctrlBtnPrimary"
            onClick={closeModal}
            style={{ width: '100%' }}
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
