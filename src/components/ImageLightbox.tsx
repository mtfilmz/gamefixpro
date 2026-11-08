import { useCallback, useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 10;
const WHEEL_INTENSITY = 0.0015;
const DOUBLE_TAP_MS = 320;
const DOUBLE_TAP_DIST = 32;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type View = { z: number; x: number; y: number };
type Size = { w: number; h: number };

/** Keeps the zoomed photo inside the frame: no empty gaps, no lost image. */
function clampOffset(view: View, fit: Size, box: Size): View {
  const { z } = view;
  if (!fit.w || !fit.h || !box.w || !box.h) return { z: 1, x: 0, y: 0 };
  const bx = (box.w - fit.w) / 2;
  const by = (box.h - fit.h) / 2;
  const w = fit.w * z;
  const h = fit.h * z;
  const x = w <= box.w ? (box.w - w) / 2 - bx : clamp(view.x, box.w - w - bx, -bx);
  const y = h <= box.h ? (box.h - h) / 2 - by : clamp(view.y, box.h - h - by, -by);
  return { z, x, y };
}

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  index?: number;
  total?: number;
}

const ImageLightbox = ({
  src,
  alt = "Foto del equipo",
  onClose,
  onPrev,
  onNext,
  index,
  total,
}: ImageLightboxProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const naturalRef = useRef<Size>({ w: 0, h: 0 });
  const fitRef = useRef<Size>({ w: 0, h: 0 });
  const boxRef = useRef<Size>({ w: 0, h: 0 });
  const viewRef = useRef<View>({ z: 1, x: 0, y: 0 });
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ dist: number; z: number; cx: number; cy: number } | null>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const movedRef = useRef(false);
  const downOnBackdropRef = useRef(false);
  const doubleTapRef = useRef(false);
  const lastTapRef = useRef<{ t: number; x: number; y: number } | null>(null);

  const [box, setBox] = useState<Size>({ w: 0, h: 0 });
  const [fit, setFit] = useState<Size>({ w: 0, h: 0 });
  const [view, setView] = useState<View>({ z: 1, x: 0, y: 0 });
  const [ready, setReady] = useState(false);

  const applyView = useCallback((v: View) => {
    const next = clampOffset(v, fitRef.current, boxRef.current);
    viewRef.current = next;
    setView(next);
  }, []);

  /** Recompute the fitted size from the natural size and re-clamp the current pan. */
  const relayout = useCallback(() => {
    const b = boxRef.current;
    const n = naturalRef.current;
    if (!b.w || !b.h || !n.w || !n.h) return;
    const s = Math.min(b.w / n.w, b.h / n.h);
    const f = { w: n.w * s, h: n.h * s };
    fitRef.current = f;
    setFit(f);
    applyView(viewRef.current);
  }, [applyView]);

  /** Zoom to `z`, keeping the point under (clientX, clientY) exactly where it is. */
  const zoomAt = useCallback(
    (z: number, clientX: number, clientY: number) => {
      const el = containerRef.current;
      const f = fitRef.current;
      if (!el || !f.w || !f.h) return;
      const rect = el.getBoundingClientRect();
      const bx = (rect.width - f.w) / 2;
      const by = (rect.height - f.h) / 2;
      const cur = viewRef.current;
      const next = clamp(z, MIN_ZOOM, MAX_ZOOM);
      const k = next / cur.z;
      const px = clientX - rect.left - bx;
      const py = clientY - rect.top - by;
      applyView({ z: next, x: px - k * (px - cur.x), y: py - k * (py - cur.y) });
    },
    [applyView],
  );

  const zoomCenter = useCallback(
    (z: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      zoomAt(z, rect.left + rect.width / 2, rect.top + rect.height / 2);
    },
    [zoomAt],
  );

  // Measure the frame and keep it up to date on resize / rotation.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const b = { w: el.clientWidth, h: el.clientHeight };
      boxRef.current = b;
      setBox(b);
      relayout();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [relayout]);

  // Wheel + trackpad pinch: native listener so preventDefault is not ignored.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const cur = viewRef.current;
      zoomAt(cur.z * Math.exp(-dy * WHEEL_INTENSITY), e.clientX, e.clientY);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && onPrev) onPrev();
      else if (e.key === "ArrowRight" && onNext) onNext();
      else if (e.key === "+" || e.key === "=") zoomCenter(viewRef.current.z * 1.4);
      else if (e.key === "-" || e.key === "_") zoomCenter(viewRef.current.z / 1.4);
      else if (e.key === "0") applyView({ z: 1, x: 0, y: 0 });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext, zoomCenter, applyView]);

  // Block page scroll behind the viewer.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // A new photo starts unzoomed and centered.
  useEffect(() => {
    setReady(false);
    fitRef.current = { w: 0, h: 0 };
    setFit({ w: 0, h: 0 });
    viewRef.current = { z: 1, x: 0, y: 0 };
    setView({ z: 1, x: 0, y: 0 });
    pinchRef.current = null;
    dragRef.current = null;
    pointersRef.current.clear();
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    naturalRef.current = { w: img.naturalWidth || 1, h: img.naturalHeight || 1 };
    setReady(true);
    relayout();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const target = e.target as HTMLElement;
    // Controls (close, arrows, zoom buttons) handle their own taps.
    if (target.closest("button")) return;

    el.setPointerCapture(e.pointerId);
    // Pointer capture retargets later events to the container, so the tap
    // location has to be read here while the real target is still known.
    downOnBackdropRef.current = target.dataset.backdrop === "1";
    doubleTapRef.current = false;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    movedRef.current = false;

    if (pointersRef.current.size === 2) {
      dragRef.current = null;
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        z: viewRef.current.z,
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
      };
      return;
    }

    // Double tap / double click toggles between full fit and 3x at the tapped point.
    const now = performance.now();
    const last = lastTapRef.current;
    if (
      last &&
      now - last.t < DOUBLE_TAP_MS &&
      Math.hypot(e.clientX - last.x, e.clientY - last.y) < DOUBLE_TAP_DIST
    ) {
      lastTapRef.current = null;
      doubleTapRef.current = true;
      const cur = viewRef.current;
      if (cur.z > 1.05) applyView({ z: 1, x: 0, y: 0 });
      else zoomAt(3, e.clientX, e.clientY);
      dragRef.current = null;
      return;
    }
    lastTapRef.current = { t: now, x: e.clientX, y: e.clientY };

    if (viewRef.current.z > 1) {
      dragRef.current = {
        x: e.clientX,
        y: e.clientY,
        ox: viewRef.current.x,
        oy: viewRef.current.y,
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    movedRef.current = true;

    const pinch = pinchRef.current;
    if (pinch && pointersRef.current.size >= 2) {
      const [a, b] = [...pointersRef.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const cur = viewRef.current;
      applyView({ z: cur.z, x: cur.x + (mid.x - pinch.cx), y: cur.y + (mid.y - pinch.cy) });
      pinch.cx = mid.x;
      pinch.cy = mid.y;
      zoomAt(pinch.z * (dist / pinch.dist), mid.x, mid.y);
      return;
    }

    const drag = dragRef.current;
    if (drag) {
      applyView({
        z: viewRef.current.z,
        x: drag.ox + (e.clientX - drag.x),
        y: drag.oy + (e.clientY - drag.y),
      });
    }
  };

  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 0) {
      dragRef.current = null;
      // A plain tap on the dark backdrop (no drag, not zoomed, not a double tap)
      // closes the viewer.
      if (
        !movedRef.current &&
        !doubleTapRef.current &&
        viewRef.current.z <= 1 &&
        downOnBackdropRef.current
      ) {
        onClose();
      }
    }
  };

  const bx = (box.w - fit.w) / 2;
  const by = (box.h - fit.h) / 2;
  const zoomed = view.z > 1.02;
  const multi = !!onPrev && !!onNext && (total || 0) > 1;

  return (
    <div
      ref={containerRef}
      data-backdrop="1"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      className="fixed inset-0 z-[70] bg-background/95 backdrop-blur-sm overflow-hidden select-none"
      style={{ touchAction: "none" }}
    >
      {/* Photo */}
      <img
        key={src}
        src={src}
        alt={alt}
        draggable={false}
        onLoad={handleLoad}
        data-backdrop="0"
        style={{
          position: "absolute",
          left: bx,
          top: by,
          width: fit.w || 1,
          height: fit.h || 1,
          maxWidth: "none",
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`,
          transformOrigin: "0 0",
          opacity: ready ? 1 : 0,
          transition: "opacity 150ms ease",
          willChange: "transform",
        }}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 pointer-events-none">
        <div className="text-xs font-semibold text-muted-foreground tabular-nums bg-background/70 rounded-full px-3 py-1.5 pointer-events-auto">
          {multi && (index || 0) + 1} / {total}
          {multi && <span className="mx-2 opacity-40">·</span>}
          <span className="tabular-nums">{Math.round(view.z * 100)}%</span>
        </div>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="pointer-events-auto bg-background/80 border border-border rounded-full w-10 h-10 flex items-center justify-center text-foreground active:scale-95 transition-transform"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Prev / next */}
      {multi && (
        <>
          <button
            type="button"
            aria-label="Foto anterior"
            onClick={onPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 border border-border rounded-full w-10 h-10 flex items-center justify-center text-foreground active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Foto siguiente"
            onClick={onNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 border border-border rounded-full w-10 h-10 flex items-center justify-center text-foreground active:scale-95 transition-transform"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/85 border border-border rounded-full px-2 py-1.5">
        <button
          type="button"
          aria-label="Alejar"
          onClick={() => zoomCenter(view.z / 1.4)}
          disabled={view.z <= MIN_ZOOM + 0.001}
          className="w-9 h-9 flex items-center justify-center rounded-full text-foreground active:scale-95 transition-transform disabled:opacity-35"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label="Restablecer zoom"
          onClick={() => applyView({ z: 1, x: 0, y: 0 })}
          disabled={!zoomed}
          className="w-9 h-9 flex items-center justify-center rounded-full text-foreground active:scale-95 transition-transform disabled:opacity-35"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label="Acercar"
          onClick={() => zoomCenter(view.z * 1.4)}
          disabled={view.z >= MAX_ZOOM - 0.001}
          className="w-9 h-9 flex items-center justify-center rounded-full text-foreground active:scale-95 transition-transform disabled:opacity-35"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      {/* Hint */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap">
        {zoomed ? "Arrastra para mover · doble toque para ajustar" : "Doble toque o rueda para acercar"}
      </div>
    </div>
  );
};

export default ImageLightbox;
