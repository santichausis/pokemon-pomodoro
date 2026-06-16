// Animated ambient background: drifting color blobs + floating pokéballs.
// Purely decorative, pointer-events disabled, sits behind the app (z-index -1).
export default function Background() {
  return (
    <div className="bgCanvas" aria-hidden="true">
      <div className="bgBlob bgBlob1" />
      <div className="bgBlob bgBlob2" />
      <div className="bgBlob bgBlob3" />
      <div className="bgPokeball bgPb1" />
      <div className="bgPokeball bgPb2" />
      <div className="bgPokeball bgPb3" />
      <div className="bgPokeball bgPb4" />
    </div>
  );
}
