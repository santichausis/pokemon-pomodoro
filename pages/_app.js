import "@/styles/globals.css";
import { Nunito, Press_Start_2P } from "next/font/google";
import ErrorBoundary from "@/components/ErrorBoundary";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
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
      <div className={`${nunito.variable} ${pressStart2P.variable}`}>
        <Component {...pageProps} />
      </div>
    </ErrorBoundary>
  );
}
