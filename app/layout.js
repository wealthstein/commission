import Providers from "./providers";
import "./globals.css";

export const metadata = {
  title: "Commission",
  description:
    "Commission — Performance-Based Customer Acquisition for Nigerian Businesses. A performance-based customer acquisition platform for businesses of every size and industry in Nigeria. List a campaign, pay only for Intent Qualified Leads or verified sales, and let affiliates do the rest — commissions paid automatically, up to 3 tiers deep.",
  metadataBase: new URL("https://commission.ng"),
  openGraph: {
    siteName: "Commission",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
