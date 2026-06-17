import { Component } from 'react';

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
      return (
        <div className="errorFallback">
          <div className="errorPokeball">
            <div className="epbTop" />
            <div className="epbBand"><div className="epbBtn" /></div>
            <div className="epbBottom" />
          </div>
          <h1>Oops! Something went wrong.</h1>
          <p>The app hit an unexpected error. Your collection is safe.</p>
          <button className="ctrlBtn ctrlBtnPrimary" onClick={this.handleReset}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
