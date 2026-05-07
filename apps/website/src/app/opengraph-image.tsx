import { ImageResponse } from "next/og";
import {
  BRAND_BACKGROUND_HEX,
  BRAND_FOREGROUND_HEX,
  BRAND_PRIMARY_HEX,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/seo/site-config";

export const alt = `${SITE_NAME}, ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        background: BRAND_BACKGROUND_HEX,
        color: BRAND_FOREGROUND_HEX,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            background: BRAND_PRIMARY_HEX,
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: BRAND_BACKGROUND_HEX,
            fontSize: 48,
            fontWeight: 600,
            letterSpacing: "-0.05em",
            lineHeight: 1,
          }}
        >
          o
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            display: "flex",
          }}
        >
          {SITE_NAME}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          maxWidth: 960,
        }}
      >
        <div
          style={{
            fontSize: 84,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>{SITE_TAGLINE}.</span>
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#555",
            lineHeight: 1.4,
            maxWidth: 920,
            display: "flex",
          }}
        >
          {SITE_DESCRIPTION}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: BRAND_PRIMARY_HEX,
            fontWeight: 500,
            display: "flex",
          }}
        >
          Certificato ARTOI
        </div>
        <div
          style={{
            fontSize: 22,
            color: "#555",
            display: "flex",
          }}
        >
          oncologo.it
        </div>
      </div>
    </div>,
    size,
  );
}
