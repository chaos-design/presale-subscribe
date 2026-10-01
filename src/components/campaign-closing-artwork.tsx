import type { CampaignTemplate } from "@/types/database"

interface CampaignClosingArtworkProps {
  template: CampaignTemplate
}

const lineProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.2,
  vectorEffect: "non-scaling-stroke" as const,
}

function CampaignClosingMotif({ template }: { template: CampaignTemplate }) {
  switch (template) {
    case "launch":
      return (
        <>
          <g data-closing-art-spin>
            <ellipse {...lineProps} cx="480" cy="90" rx="166" ry="52" />
            <ellipse {...lineProps} cx="480" cy="90" rx="104" ry="76" strokeDasharray="4 8" />
          </g>
          <path
            {...lineProps}
            d="M52 136C222 22 356 26 480 90s264 68 428-32"
            data-closing-art-draw
            pathLength="1"
          />
          <circle cx="748" cy="104" r="7" fill="var(--campaign-color)" data-closing-art-pulse />
        </>
      )
    case "editorial":
      return (
        <>
          <g data-closing-art-layer>
            <rect x="74" y="26" width="168" height="112" fill="currentColor" opacity="0.08" />
            <rect x="260" y="26" width="74" height="112" fill="currentColor" opacity="0.16" />
            <rect
              x="352"
              y="26"
              width="230"
              height="112"
              fill="var(--campaign-color)"
              opacity="0.16"
            />
          </g>
          <path
            {...lineProps}
            d="M42 26H918M42 138H918M612 26V138M716 26V138M42 82H918"
            data-closing-art-draw
            pathLength="1"
          />
          <rect x="736" y="42" width="150" height="12" fill="var(--campaign-color)" />
        </>
      )
    case "signal":
      return (
        <>
          <path
            {...lineProps}
            d="M36 96h126l22-42 40 86 42-96 44 60 30-20h140l26-28 34 64 38-48 28 24h278"
            data-closing-art-draw
            pathLength="1"
          />
          <g fill="var(--campaign-color)" data-closing-art-layer>
            <circle cx="184" cy="54" r="5" />
            <circle cx="480" cy="84" r="5" />
            <circle cx="704" cy="72" r="5" />
          </g>
          <rect x="36" y="26" width="888" height="124" {...lineProps} strokeDasharray="2 8" />
          <line
            x1="40"
            x2="920"
            y1="42"
            y2="42"
            stroke="var(--campaign-color)"
            data-closing-art-scan
          />
        </>
      )
    case "orbit":
      return (
        <>
          <g data-closing-art-spin>
            <ellipse {...lineProps} cx="480" cy="88" rx="316" ry="60" />
            <ellipse
              {...lineProps}
              cx="480"
              cy="88"
              rx="222"
              ry="84"
              strokeDasharray="3 9"
              transform="rotate(-7 480 88)"
            />
            <ellipse {...lineProps} cx="480" cy="88" rx="128" ry="42" />
          </g>
          <circle cx="776" cy="66" r="6" fill="var(--campaign-color)" data-closing-art-pulse />
          <circle cx="352" cy="126" r="3" fill="currentColor" />
        </>
      )
    case "prism":
      return (
        <>
          <g data-closing-art-layer>
            <path d="M236 142 360 18l116 124Z" fill="currentColor" opacity="0.1" />
            <path d="m394 142 126-124 116 124Z" fill="var(--campaign-color)" opacity="0.28" />
            <path d="m550 142 126-124 112 124Z" fill="currentColor" opacity="0.16" />
          </g>
          <path
            {...lineProps}
            d="M54 118 312 48l170 42 166-44 258 72"
            data-closing-art-draw
            pathLength="1"
          />
          <line
            x1="160"
            x2="800"
            y1="36"
            y2="136"
            stroke="var(--campaign-color)"
            opacity="0.7"
            data-closing-art-scan
          />
        </>
      )
    case "monolith":
      return (
        <>
          <g data-closing-art-layer>
            <rect x="312" y="16" width="92" height="132" fill="currentColor" opacity="0.12" />
            <rect
              x="418"
              y="34"
              width="124"
              height="114"
              fill="var(--campaign-color)"
              opacity="0.7"
            />
            <rect x="556" y="58" width="92" height="90" fill="currentColor" opacity="0.2" />
          </g>
          <path
            {...lineProps}
            d="M82 148H878M82 118h190M688 118h190M480 12v140"
            data-closing-art-draw
            pathLength="1"
          />
          <rect x="434" y="48" width="92" height="86" {...lineProps} data-closing-art-pulse />
        </>
      )
    case "atelier":
      return (
        <>
          <path
            {...lineProps}
            d="M54 24H906M54 78H906M54 132H906M210 24V132M480 24V132M750 24V132"
            data-closing-art-draw
            pathLength="1"
          />
          <g data-closing-art-layer>
            <rect
              x="210"
              y="24"
              width="270"
              height="54"
              fill="var(--campaign-color)"
              opacity="0.8"
            />
            <rect x="480" y="78" width="270" height="54" fill="currentColor" opacity="0.12" />
            <circle cx="828" cy="51" r="24" fill="currentColor" opacity="0.18" />
          </g>
        </>
      )
    case "nocturne":
      return (
        <>
          <g data-closing-art-spin>
            <circle {...lineProps} cx="480" cy="84" r="70" />
            <circle {...lineProps} cx="480" cy="84" r="48" strokeDasharray="2 8" opacity="0.72" />
          </g>
          <path
            {...lineProps}
            d="M92 132 246 32h468l154 100M182 132h596"
            data-closing-art-draw
            pathLength="1"
          />
          <g fill="var(--campaign-color)" data-closing-art-layer>
            <circle cx="246" cy="32" r="4" />
            <circle cx="714" cy="32" r="4" />
            <circle cx="480" cy="84" r="7" data-closing-art-pulse />
          </g>
        </>
      )
    case "kinetic":
      return (
        <>
          <g data-closing-art-layer>
            <path d="m54 138 154-116h118L172 138Z" fill="currentColor" opacity="0.16" />
            <path d="m302 138 154-116h172L474 138Z" fill="var(--campaign-color)" opacity="0.78" />
            <path d="m622 138 128-96h156L778 138Z" fill="currentColor" opacity="0.22" />
          </g>
          <path
            {...lineProps}
            d="m54 86 176-48 150 82 190-96 336 70"
            data-closing-art-draw
            pathLength="1"
          />
        </>
      )
    case "broadsheet":
      return (
        <>
          <path
            {...lineProps}
            d="M44 26H916M44 50H916M44 136H916M276 50v86M504 50v86M732 50v86"
            data-closing-art-draw
            pathLength="1"
          />
          <g data-closing-art-layer>
            <rect x="62" y="68" width="188" height="10" fill="currentColor" opacity="0.18" />
            <rect x="62" y="88" width="142" height="6" fill="currentColor" opacity="0.1" />
            <rect
              x="750"
              y="64"
              width="146"
              height="54"
              fill="var(--campaign-color)"
              opacity="0.72"
            />
          </g>
          <line
            x1="44"
            x2="916"
            y1="40"
            y2="40"
            stroke="var(--campaign-color)"
            data-closing-art-scan
          />
        </>
      )
    case "playground":
      return (
        <>
          <g data-closing-art-layer>
            <circle cx="202" cy="82" r="54" fill="var(--campaign-color)" />
            <rect
              x="404"
              y="28"
              width="108"
              height="108"
              fill="#2457d6"
              transform="rotate(8 458 82)"
            />
            <path d="m688 136 62-108 62 108Z" fill="currentColor" opacity="0.72" />
          </g>
          <path
            {...lineProps}
            d="M48 120c70-78 128-78 194 0s128 78 194 0 128-78 194 0 128 78 282-18"
            data-closing-art-draw
            pathLength="1"
          />
        </>
      )
    case "ledger":
      return (
        <>
          <path
            {...lineProps}
            d="M44 32H916M44 132H916M248 32v100M704 32v100"
            strokeDasharray="5 6"
            data-closing-art-draw
            pathLength="1"
          />
          <g fill="currentColor" opacity="0.5" data-closing-art-layer>
            {Array.from({ length: 14 }, (_, index) => (
              <rect
                key={index}
                x={728 + index * 11}
                y={52}
                width={index % 3 === 0 ? 5 : 2}
                height={60}
              />
            ))}
          </g>
          <path d="M82 58h122v18H82z" fill="var(--campaign-color)" opacity="0.78" />
          <circle cx="478" cy="82" r="28" {...lineProps} data-closing-art-pulse />
        </>
      )
    case "terrain":
      return (
        <>
          <g data-closing-art-layer>
            <path
              {...lineProps}
              d="M34 116c86-100 166-100 244-28s150 72 224 4 154-68 212 2 126 70 212-10"
            />
            <path
              {...lineProps}
              d="M34 138c92-76 170-72 242-20s148 54 224 6 158-50 218 0 124 48 208-4"
              strokeDasharray="4 7"
            />
            <path
              {...lineProps}
              d="M60 82c68-70 132-68 194-18s128 48 196 0 144-50 204 0 126 50 246-14"
              opacity="0.62"
            />
          </g>
          <path
            {...lineProps}
            d="M86 128 246 66l176 28 152-52 278 62"
            stroke="var(--campaign-color)"
            data-closing-art-draw
            pathLength="1"
          />
          <circle cx="574" cy="42" r="6" fill="var(--campaign-color)" data-closing-art-pulse />
        </>
      )
    case "broadcast":
      return (
        <>
          <path
            {...lineProps}
            d="M38 84h88l20-18 22 38 28-74 34 108 32-84 28 54 26-24h328l20-18 22 38 28-74 34 108 32-84 28 54 26-24h88"
            data-closing-art-draw
            pathLength="1"
          />
          <g data-closing-art-spin>
            <circle {...lineProps} cx="480" cy="84" r="50" opacity="0.46" />
            <circle {...lineProps} cx="480" cy="84" r="72" opacity="0.24" strokeDasharray="3 7" />
          </g>
          <circle cx="480" cy="84" r="7" fill="var(--campaign-color)" data-closing-art-pulse />
        </>
      )
    case "catalog":
      return (
        <>
          <path
            {...lineProps}
            d="M48 30H912M48 136H912M230 30v106M468 30v106M706 30v106"
            data-closing-art-draw
            pathLength="1"
          />
          <g data-closing-art-layer>
            <rect x="72" y="54" width="132" height="58" fill="currentColor" opacity="0.12" />
            <rect
              x="254"
              y="54"
              width="190"
              height="12"
              fill="var(--campaign-color)"
              opacity="0.8"
            />
            <rect x="492" y="54" width="190" height="58" fill="currentColor" opacity="0.08" />
            <rect
              x="730"
              y="54"
              width="158"
              height="58"
              fill="var(--campaign-color)"
              opacity="0.2"
            />
          </g>
        </>
      )
    case "biolab":
      return (
        <>
          <g data-closing-art-layer>
            <path
              d="M118 82c0-38 34-64 72-52 28 8 38 34 64 38 34 4 46-34 82-28 40 6 44 54 22 80-30 34-76 10-112 12-56 2-128 18-128-50Z"
              fill="var(--campaign-color)"
              opacity="0.18"
            />
            <path
              d="M598 42c34-28 82-8 86 34 4 28-14 42 2 62H574c18-22 2-42 4-64 2-12 8-24 20-32Z"
              fill="currentColor"
              opacity="0.1"
            />
          </g>
          <path
            {...lineProps}
            d="M52 116c116-72 194-62 288-6s180 54 270-12 176-54 298 24"
            data-closing-art-draw
            pathLength="1"
          />
          <g data-closing-art-spin>
            <circle {...lineProps} cx="760" cy="82" r="44" />
            <circle cx="724" cy="58" r="7" fill="var(--campaign-color)" />
            <circle cx="794" cy="100" r="5" fill="currentColor" />
          </g>
        </>
      )
  }
}

export function CampaignClosingArtwork({ template }: CampaignClosingArtworkProps) {
  return (
    <div
      className="campaign-closing-artwork"
      data-campaign-closing-art
      data-template-motif={template}
      aria-hidden="true"
    >
      <svg viewBox="0 0 960 164" preserveAspectRatio="none" focusable="false" role="presentation">
        <g className="campaign-closing-artwork-motif">
          <CampaignClosingMotif template={template} />
        </g>
      </svg>
    </div>
  )
}
