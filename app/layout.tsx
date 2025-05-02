import { Inter } from "next/font/google";
import "./globals.scss";
import { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}


export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      template: "Tech Element It Limited | %s",
      default: "Tech Element It Limited",
    },
    description: "An advanced medical center equipped with international standard machinery, located near Dhaka in Savar",
    keywords: ["hospital", "medical", "healthcare", "Dhaka", "Savar", "Super Medical"],
    icons: {
      icon: "https://i.ibb.co.com/FqLNg9pz/Screenshot-658.png",
    },
  };
}
