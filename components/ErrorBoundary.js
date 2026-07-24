import { Component } from 'react';
import { T, detectLang } from '@/lib/i18n';
import Pokeball from '@/components/Pokeball';

// Reads the language independently of Home's React state, which is gone by
// the time this fallback renders (the crash unmounted whatever held it).
function currentLang() {
  if (typeof localStorage === 'undefined') return detectLang();
  const saved = localStorage.getItem('poke-lang');
  return saved === 'en' || saved === 'es' ? saved : detectLang();
}

// Catches render-time errors so a single failure doesn't blank the whole app.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (typeof console !== 'undefined') console.error('App error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const t = T[currentLang()] || T.en;
      return (
        <div className="errorFallback">
          <div className="errorPokeball">
            <Pokeball prefix="epb" />
          </div>
          <h1>{t.errorBoundaryTitle}</h1>
          <p>{t.errorBoundaryMsg}</p>
          <button className="ctrlBtn ctrlBtnPrimary" onClick={this.handleReset}>
            {t.btnReload}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
