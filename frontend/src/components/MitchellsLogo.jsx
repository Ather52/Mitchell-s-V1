import mitchellsLogo from "../assets/images/mitchell's.png";
function MitchellsLogo({ height = 30, style, className }) {
  return <img
    src={mitchellsLogo}
    alt="Mitchell's Logo"
    style={{ height, display: "block", objectFit: "contain", ...style }}
    className={className}
  />;
}
export {
  MitchellsLogo
};
