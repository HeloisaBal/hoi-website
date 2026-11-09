/* ------------------------------------------------------------
   A photo cut into the shape of the teal "o" from the hoi logo
   (a little house with a sloped roof), with:
   - a solid block in the persona's accent colour behind it, offset
     like a 3D extrusion, that slides out on entry
   - the round dot from the logo's "i"
   - a gentle 3D tilt that follows the pointer (--tx / --ty, -1..1,
     set by the hero section)
   ------------------------------------------------------------ */
export function HousePhoto({ src, alt, style }: { src: string; alt: string; style?: React.CSSProperties }) {
  return (
    <figure className="house" style={style}>
      <span className="house-word" aria-hidden="true">hoi</span>
      <div className="house-tilt">
        <div className="house-shadow" aria-hidden="true" />
        <div className="house-photo">
          <img src={src} alt={alt} width={708} height={885} />
        </div>
        <span className="house-dot" aria-hidden="true" />
      </div>
    </figure>
  )
}
