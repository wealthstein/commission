import Providers from "./providers";
import "./globals.css";

export const metadata = {
  title: "Commission — Nigeria's Affiliate Marketplace",
  description:
    "List products, launch multi-tier affiliate programs, and pay commissions automatically. Or join as an affiliate and earn from products you already recommend.",
  metadataBase: new URL("https://commission.ng"),
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
