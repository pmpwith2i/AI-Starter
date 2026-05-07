import { ImageResponse } from "next/og";
import { BRAND_BACKGROUND_HEX, BRAND_PRIMARY_HEX } from "@/lib/seo/site-config";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_PRIMARY_HEX,
        borderRadius: "96px",
      }}
    >
      <div
        style={{
          fontSize: 340,
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
