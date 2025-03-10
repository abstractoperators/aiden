import Link from "next/link"
import { SocialLinks } from "./SocialLinks"

const baseFooterStyle = "w-full flex justify-center"
enum footerStyles {
  landing = `${baseFooterStyle}`,
  main = `${baseFooterStyle} bg-background/10 backdrop-blur supports-[backdrop-filter]:bg-background/10`
}

interface variantOutputs {
  footerStyle: footerStyles,
}
interface variantProp {
  variant?: "landing" | "main",
}
function getVariantOutputs(variant: variantProp["variant"]): variantOutputs {
  switch (variant) {
    case "landing":
      return {
        footerStyle: footerStyles.landing,
      }
    case "main":
    default:
      return {
        footerStyle: footerStyles.main,
      }
  }
}

export default function Footer({ variant }: variantProp) {
  const { footerStyle } = getVariantOutputs(variant)

  return (
    <footer className={footerStyle}>
      <div className="container flex flex-col items-center justify-between text-sm gap-4 py-10 md:flex-row md:py-4">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center leading-loose md:text-left">
            © 2025 AIDEN. All rights reserved.
          </p>
        </div>
        <SocialLinks />
      </div>
    </footer>
  )
}
