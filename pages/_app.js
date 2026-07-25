import "@/styles/globals.css";
import { Plus_Jakarta_Sans, Press_Start_2P } from "next/font/google";
import ErrorBoundary from "@/components/ErrorBoundary";

// Hallmark · Hum genre — rounded-sans throughout (display + body), no serif
// anywhere. Press Start 2P survives only as a scoped "character" accent on
// the timer digits and streak/mono labels, not as the UI's general voice.
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const pressStart2P = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-press-start",
  display: "swap",
});

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <div className={`appRoot ${plusJakarta.variable} ${pressStart2P.variable}`}>
        <Component {...pageProps} />
      </div>
    </ErrorBoundary>
  );
}
