"use client";

import { useState } from "react";

interface FilePreviewProps {
  url: string | null;
  label: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: "w-16 h-16",
  md: "w-28 h-28",
  lg: "w-40 h-40",
};

function isImage(url: string) {
  return url.startsWith("data:image/") || /\.(jpe?g|png|gif|webp|svg)$/i.test(url);
}

export default function FilePreview({ url, label, size = "md" }: FilePreviewProps) {
  const [expanded, setExpanded] = useState(false);

  if (!url) {
    return (
      <div className={`${SIZE_MAP[size]} rounded-lg border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center`}>
        <p className="text-[10px] text-gray-400 text-center px-1">No {label}</p>
      </div>
    );
  }

  if (!isImage(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${SIZE_MAP[size]} rounded-lg border border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1 hover:bg-gray-100 transition`}
      >
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="text-[10px] text-blue-600 font-medium">View File</span>
      </a>
    );
  }

  return (
    <>
      <button onClick={() => setExpanded(true)} className="group relative">
        <img
          src={url}
          alt={label}
          className={`${SIZE_MAP[size]} rounded-lg border border-gray-200 object-cover cursor-pointer group-hover:brightness-90 transition`}
        />
      </button>

      {expanded && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setExpanded(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative max-w-3xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setExpanded(false)}
              className="absolute -top-3 -right-3 z-10 bg-white rounded-full p-1.5 shadow-lg hover:bg-gray-100 transition"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={url} alt={label} className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain" />
          </div>
        </div>
      )}
    </>
  );
}
