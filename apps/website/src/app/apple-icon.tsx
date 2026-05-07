import { ImageResponse } from "next/og";
import { BRAND_BACKGROUND_HEX, BRAND_PRIMARY_HEX } from "@/lib/seo/site-config";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_PRIMARY_HEX,
      }}
    >
      <div
        style={{
          fontSize: 120,
          color: BRAND_BACKGROUND_HEX,
          fontWeight: 600,
          letterSpacing: "-0.05em",
          lineHeight: 1,
          display: "flex",
        }}
      >
        o
      </div>
    </div>,
    size,
  );
}
