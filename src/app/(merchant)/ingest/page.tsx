"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatNaira } from "@/lib/utils";
import { Link, Upload, Check, AlertCircle, Loader2 } from "lucide-react";
const Instagram = Link;

type Source = "instagram" | "upload";

interface ScannedProduct {
  id?: string;
  name: string;
  price: number;
  category: string;
  image_url: string;
  in_stock: boolean;
  ai_confidence: number;
  reviews?: number;
  status: "done" | "error";
  error?: string;
}

interface StreamEvent {
  type: "start" | "product" | "error" | "done" | "status" | "fatal";
  total?: number;
  index?: number;
  product?: Omit<ScannedProduct, "status">;
  message?: string;
  jobId?: string;
}

export default function IngestPage() {
  const [source, setSource] = useState<Source>("upload");
  const [igUrls, setIgUrls] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [total, setTotal] = useState(0);
  const [products, setProducts] = useState<ScannedProduct[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const processed = products.filter((p) => p.status === "done").length;
  const progress = total > 0 ? Math.round((processed / total) * 100) : 0;

  const handleFiles = useCallback((selected: FileList | null) => {
    if (!selected) return;
    const arr = Array.from(selected).slice(0, 50);
    setFiles(arr);
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  async function startScan() {
    setScanning(true);
    setDone(false);
    setProducts([]);
    setStatusMsg("Starting...");

    try {
      let res: Response;

      if (source === "instagram") {
        const trimmed = igUrls.trim();
        const isProfile =
          trimmed.includes("instagram.com/") &&
          !trimmed.includes("/p/") &&
          !trimmed.includes("/reel/");
        res = await fetch("/api/ingest/instagram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isProfile ? { profileUrl: trimmed } : { postUrls: trimmed }
          ),
        });
      } else {
        const formData = new FormData();
        files.forEach((f) => formData.append("images", f));
        res = await fetch("/api/ingest/upload", { method: "POST", body: formData });
      }

      if (!res.ok || !res.body) {
        toast("Scan failed. Please try again.", "error");
        setScanning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event: StreamEvent = JSON.parse(line.slice(6));

            if (event.type === "start") {
              setTotal(event.total ?? 0);
            } else if (event.type === "status") {
              setStatusMsg(event.message ?? "");
            } else if (event.type === "product" && event.product) {
              setProducts((prev) => [...prev, { ...event.product!, status: "done" }]);
            } else if (event.type === "error") {
              setProducts((prev) => [
                ...prev,
                { name: `Product ${(event.index ?? 0) + 1}`, price: 0, category: "", image_url: "", in_stock: true, ai_confidence: 0, status: "error", error: event.message },
              ]);
            } else if (event.type === "done") {
              setDone(true);
              setScanning(false);
              setStatusMsg("Scan complete");
            } else if (event.type === "fatal") {
              const msg = event.message ?? "Scan failed";
              const isIgBlock = msg.includes("429") || msg.includes("blocked") || msg.includes("private");
              toast(
                isIgBlock
                  ? "Instagram blocked the request. Switching to photo upload — drop your product photos instead."
                  : msg,
                "error"
              );
              if (isIgBlock) setSource("upload");
              setScanning(false);
            }
          } catch {}
        }
      }
    } catch {
      toast("Connection lost. Please try again.", "error");
      setScanning(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1208]">Import your products</h1>
        <p className="text-[#7A6E62] mt-1">
          Paste your Instagram link or upload up to 50 photos. AI handles the rest.
        </p>
      </div>

      {!scanning && !done && (
        <>
          {/* Source tabs */}
          <div className="flex gap-2 mb-6 bg-[#F5F0E8] p-1 rounded-xl w-fit">
            {(["upload", "instagram"] as Source[]).map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  source === s
                    ? "bg-white text-[#1A1208] shadow-sm"
                    : "text-[#7A6E62] hover:text-[#1A1208]"
                }`}
              >
                {s === "instagram" ? <Instagram size={14} /> : <Upload size={14} />}
                {s === "upload" ? "Upload photos" : "Instagram"}
              </button>
            ))}
          </div>

          {source === "instagram" ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#7A6E62]">Instagram profile or post links</label>
                <textarea
                  className="w-full rounded-xl border border-[#E8E0D4] bg-white px-4 py-3 text-sm text-[#1A1208] placeholder:text-[#B0A89E] resize-none focus:outline-none focus:ring-2 focus:ring-[#1A1208]/10"
                  rows={4}
                  placeholder={"Profile URL:\nhttps://www.instagram.com/herboutiquelagos\n\nOr individual post links, one per line."}
                  value={igUrls}
                  onChange={(e) => setIgUrls(e.target.value)}
                />
                <p className="text-xs text-[#B0A89E]">
                  Paste a profile URL to scan up to 12 posts automatically, or paste individual post links.
                </p>
              </div>
              <Button
                onClick={startScan}
                disabled={!igUrls.includes("instagram.com")}
                className="w-full h-12"
              >
                Import posts
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-[#E8E0D4] rounded-2xl p-10 text-center cursor-pointer hover:border-[#1A1208] hover:bg-[#F5F0E8] transition-colors"
              >
                <Upload size={28} className="mx-auto text-[#B0A89E] mb-3" />
                <p className="text-sm font-medium text-[#1A1208]">
                  {files.length > 0 ? `${files.length} photo${files.length > 1 ? "s" : ""} selected` : "Drop photos here or tap to select"}
                </p>
                <p className="text-xs text-[#7A6E62] mt-1">Up to 50 photos · JPG, PNG, WEBP</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>

              {files.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {files.slice(0, 8).map((f, i) => (
                    <div key={i} className="w-14 h-14 rounded-lg bg-[#F5F0E8] overflow-hidden border border-[#E8E0D4]">
                      <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {files.length > 8 && (
                    <div className="w-14 h-14 rounded-lg bg-[#F5F0E8] border border-[#E8E0D4] flex items-center justify-center text-xs text-[#7A6E62] font-medium">
                      +{files.length - 8}
                    </div>
                  )}
                </div>
              )}

              <Button onClick={startScan} disabled={files.length === 0} className="w-full h-12">
                Start scanning
              </Button>
            </div>
          )}
        </>
      )}

      {/* Live scanning view */}
      {(scanning || done) && (
        <div className="flex flex-col gap-6">
          {/* Progress bar */}
          <div className="bg-white rounded-2xl border border-[#E8E0D4] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {scanning && <Loader2 size={16} className="animate-spin text-[#C4973A]" />}
                {done && <Check size={16} className="text-[#2D6A4F]" />}
                <span className="text-sm font-medium text-[#1A1208]">
                  {done ? "Scan complete" : statusMsg || "Scanning..."}
                </span>
              </div>
              <span className="text-sm text-[#7A6E62]">
                {processed}/{total} products
              </span>
            </div>
            <div className="h-1.5 bg-[#F5F0E8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1A1208] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Live product grid — appears as products come in */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Placeholder slots for pending products */}
            {Array.from({ length: Math.max(0, total - products.length) }).map((_, i) => (
              <div key={`placeholder-${i}`} className="bg-[#F5F0E8] rounded-2xl aspect-[3/4] animate-pulse border border-[#E8E0D4]" />
            ))}

            {/* Real products in reverse so newest appears first */}
            {[...products].reverse().map((p, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E8E0D4] overflow-hidden">
                {p.status === "error" ? (
                  <div className="aspect-[3/4] flex flex-col items-center justify-center gap-2 p-4">
                    <AlertCircle size={20} className="text-[#B45309]" />
                    <p className="text-xs text-[#7A6E62] text-center">Could not parse this image</p>
                  </div>
                ) : (
                  <>
                    <div className="aspect-square bg-[#F5F0E8] relative overflow-hidden">
                      {p.image_url && (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-[#1A1208] line-clamp-1">{p.name}</p>
                      <p className="text-sm font-bold text-[#1A1208] mt-0.5">{formatNaira(p.price)}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Badge variant="default" className="text-[10px]">{p.category}</Badge>
                        {p.reviews ? <Badge variant="new" className="text-[10px]">{p.reviews} reviews</Badge> : null}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {done && (
            <div className="flex flex-col gap-3">
              <div className="bg-[#F5F0E8] rounded-2xl p-5 text-center">
                <p className="text-sm font-medium text-[#1A1208]">
                  {processed} product{processed !== 1 ? "s" : ""} imported
                </p>
                <p className="text-xs text-[#7A6E62] mt-1">
                  Review and approve them in your dashboard to make them live
                </p>
              </div>
              <Button onClick={() => router.push("/dashboard")} className="w-full h-12">
                Review products
              </Button>
              <Button variant="secondary" onClick={() => { setDone(false); setProducts([]); setFiles([]); setIgUrls(""); }} className="w-full h-12">
                Import more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
