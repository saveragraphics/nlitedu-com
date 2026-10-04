"use client";
import Link from "next/link";
import { CSSProperties, useRef } from "react";
import "./NlitLogo.css";

type Piece = { cls: string; img: string; l: string; t: string; w: string; h: string; d?: string };

const CAP_GROUP: Piece[] = [
  { cls: "cap", img: "cap", l: "2.695%", t: "0.976%", w: "93.114%", h: "51.707%" },
  { cls: "sq", img: "sq1", l: "59.581%", t: "3.171%", w: "5.689%", h: "4.390%", d: "0s" },
  { cls: "sq", img: "sq2", l: "50.000%", t: "7.561%", w: "5.689%", h: "4.390%", d: ".9s" },
  { cls: "sq", img: "sq3", l: "59.581%", t: "13.415%", w: "5.689%", h: "4.390%", d: "1.7s" },
  { cls: "bulb", img: "bulb", l: "7.186%", t: "23.171%", w: "13.473%", h: "12.439%" },
];

const BOOKS: Piece[] = [
  { cls: "bookL", img: "bookL", l: "1.497%", t: "37.317%", w: "47.305%", h: "60.732%" },
  { cls: "bookR", img: "bookR", l: "50.599%", t: "37.561%", w: "47.006%", h: "60.732%" },
];

const WORD: Piece[] = [
  { cls: "N", img: "N", l: "0.163%", t: "3.704%", w: "30.081%", h: "94.444%" },
  { cls: "Lt", img: "Lt", l: "36.911%", t: "3.704%", w: "24.065%", h: "94.444%" },
  { cls: "person", img: "person", l: "51.545%", t: "11.111%", w: "25.691%", h: "87.037%" },
  { cls: "head", img: "head", l: "61.951%", t: "0.926%", w: "9.268%", h: "26.389%" },
  { cls: "Tt", img: "Tt", l: "75.447%", t: "0.463%", w: "23.902%", h: "99.537%" },
];

const renderPiece = (p: Piece) => (
  <i
    key={p.img}
    className={`l ${p.cls}`}
    style={{ "--l": p.l, "--t": p.t, "--w": p.w, "--h": p.h, ...(p.d && { "--d": p.d }) } as CSSProperties}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img alt="" src={`/nlit-logo/${p.img}.png`} />
  </i>
);

const NlitLogo = ({ className = "" }: { className?: string }) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // Replay the entry animation on hover
  const replay = () => {
    const a = ref.current;
    if (!a) return;
    a.classList.remove("nlit-run");
    void a.offsetWidth;
    a.classList.add("nlit-run");
  };

  return (
    <Link
      ref={ref}
      href="/"
      aria-label="NLIT – Nexgen Learning Institute of Technology"
      className={`nlit-logo nlit-run ${className}`}
      onPointerEnter={(e) => {
        // Mouse only: on touch devices a hover-triggered change swallows the first tap
        if (e.pointerType !== "mouse") return;
        clearTimeout(timer.current);
        timer.current = setTimeout(replay, 150);
      }}
    >
      <span className="nlit-icon" aria-hidden="true">
        <b className="grp capgrp">{CAP_GROUP.map(renderPiece)}</b>
        {BOOKS.map(renderPiece)}
      </span>
      <span className="nlit-word" aria-hidden="true">
        {WORD.map(renderPiece)}
      </span>
    </Link>
  );
};

export default NlitLogo;
