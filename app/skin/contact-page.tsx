import "./skin-product.css";
import "./pages-beauty.css";
import "./more-beauty.css";
import { V2Footer } from "../v2-footer";
import { bpFontVars, bpBodyFonts } from "./beauty-fonts";
import ContactBeauty from "./contact-beauty";

/** The SkinRecs contact page: the beauty fonts and look around the client form (app/skin/contact-beauty.tsx). */
export default function ContactPage() {
  return <main className={`bp bt ${bpFontVars}`}><style>{bpBodyFonts}</style><div className="bt-wrap"><ContactBeauty/></div><V2Footer/></main>;
}
