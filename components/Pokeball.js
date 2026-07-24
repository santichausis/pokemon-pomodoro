// Decorative Pokéball icon markup, shared by the header, empty state and
// error fallback. `prefix` selects the CSS class family (e.g. 'hpb', 'epb')
// so each caller keeps its own size/color via the wrapper element's CSS —
// this only dedupes the repeated inner div structure, not the styling.
export default function Pokeball({ prefix }) {
  return (
    <>
      <div className={`${prefix}Top`} />
      <div className={`${prefix}Band`}><div className={`${prefix}Btn`} /></div>
      <div className={`${prefix}Bottom`} />
    </>
  );
}
