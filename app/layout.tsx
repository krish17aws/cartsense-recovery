import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:"CartSense Recovery Agent",description:"AI-powered abandoned cart recovery operations console.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
