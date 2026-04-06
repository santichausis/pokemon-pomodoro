import { TYPE_CLASSES } from '@/lib/constants';

export default function CaptureModal({
  showModal,
  modalPhase,
  captured,
  currentGoal,
  t,
  closeModal,
}) {
  if (!showModal) return null;

  return (
    <div className="modalOverlay">
      <div className="modalCard">
        <div className="modalHeader">
          <p className="modalStars">{t.modalStars}</p>
          <h2 className="modalTitle">{t.modalTitle}</h2>
          <p className="modalGoal">&ldquo;{currentGoal}&rdquo;</p>
        </div>

        {(modalPhase === 'shaking' || modalPhase === 'opening') && (
          <div className="captureStage">
            <div className={`pokeballAnim${modalPhase === 'opening' ? ' pokeballOpening' : ''}`}>
              <div className="pbaTop" />
              <div className="pbaBand"><div className="pbaBtn" /></div>
              <div className="pbaBottom" />
            </div>
          </div>
        )}

        {modalPhase === 'reveal' && captured && (
          <div className="pokemonReveal">
            <div className="revealGlow" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="pokemonSprite" src={captured.sprite} alt={captured.name} />
            <span className="revealNumber">#{String(captured.id).padStart(3, '0')}</span>
            <h3 className="revealName">{captured.name}</h3>
            <div className="revealTypes">
              {captured.types.map(tp => (
                <span key={tp} className={`typeBadge ${TYPE_CLASSES[tp] || ''}`}>{tp}</span>
              ))}
            </div>
            <div className="capturedBanner">{t.capturedBanner}</div>
          </div>
        )}

        {modalPhase === 'reveal' && (
          <button className="ctrlBtn ctrlBtnPrimary" onClick={closeModal} style={{ width: '100%' }}>
            {t.btnContinueModal}
          </button>
        )}
      </div>
    </div>
  );
}
