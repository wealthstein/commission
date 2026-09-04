import Providers from "./providers";
import "./globals.css";

export const metadata = {
  title: "Commission",
  description:
    "Commission — Performance-Based Customer Acquisition for Nigerian Businesses. A performance-based customer acquisition platform for businesses of every size and industry in Nigeria. List a campaign, pay only for Intent Qualified Leads or verified sales, and let affiliates do the rest — commissions paid automatically, up to 3 tiers deep.",
  metadataBase: new URL("https://commission.ng"),
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Commission" },
  openGraph: {
    siteName: "Commission",
  },
};

export const viewport = {
  themeColor: "#FFCB05",
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
