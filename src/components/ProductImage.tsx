"use client";

import Image from "next/image";
import { useState } from "react";

function Placeholder({ name }: { name: string }) {
  const text = name.slice(0, 16);
  return (
    <svg viewBox="0 0 800 800" className="h-auto w-full">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4f4f5" />
          <stop offset="100%" stopColor="#fafafa" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="800" height="800" fill="url(#bg)" />
      <rect x="40" y="40" width="720" height="720" rx="28" fill="#ffffff" stroke="#e4e4e7" strokeWidth="2" />
      <text x="80" y="140" fontSize="22" fill="#71717a" letterSpacing="4">
        UNIQLO-STYLE
      </text>
      <text x="80" y="210" fontSize="44" fill="#18181b" fontWeight="600">
        {text}
      </text>
      <text x="80" y="260" fontSize="18" fill="#52525b">
        Placeholder SVG（离线/无版权素材）
      </text>
      <g opacity="0.08">
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={i} x1={80} y1={320 + i * 22} x2={720} y2={320 + i * 22} stroke="#09090b" strokeWidth="2" />
        ))}
      </g>
    </svg>
  );
}

export default function ProductImage({
  name,
  localImage,
  imageUrl,
  className,
  width = 800,
  height = 800,
  priority = false,
}: {
  name: string;
  localImage?: string;
  imageUrl?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}) {
  const [preferRemote, setPreferRemote] = useState(false);
  const [remoteFailed, setRemoteFailed] = useState(false);

  const src = preferRemote || !localImage ? imageUrl : localImage;
  if (!src || (preferRemote && remoteFailed)) {
    return <Placeholder name={name} />;
  }

  return (
    <Image
      src={src}
      alt={name}
      width={width}
      height={height}
      className={className ?? "aspect-square h-auto w-full object-cover"}
      unoptimized
      priority={priority}
      onError={() => {
        if (!preferRemote && localImage && imageUrl) {
          setPreferRemote(true);
          return;
        }
        setRemoteFailed(true);
      }}
    />
  );
}
