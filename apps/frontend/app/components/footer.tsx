import Link from "next/link";

const baseFooterStyle = "w-full flex justify-center";
enum footerStyles {
   landing = `${baseFooterStyle}`,
   main = `${baseFooterStyle} bg-background/10 backdrop-blur supports-[backdrop-filter]:bg-background/10`,
}

interface variantOutputs {
   footerStyle: footerStyles;
}
interface variantProp {
   variant?: "landing" | "main";
}
function getVariantOutputs(variant: variantProp["variant"]): variantOutputs {
   switch (variant) {
      case "landing":
         return {
            footerStyle: footerStyles.landing,
         };
      case "main":
      default:
         return {
            footerStyle: footerStyles.main,
         };
   }
}

export default function Footer({ variant }: variantProp) {
   const { footerStyle } = getVariantOutputs(variant);

   return (
      <footer className={footerStyle}>
         <div className="w-full py-4 text-center text-sm text-gray-500">© 2025 AIDEN. All rights reserved.</div>
      </footer>
   );
}
