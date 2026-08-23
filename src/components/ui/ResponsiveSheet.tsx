"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

interface ResponsiveSheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  desktopVariant?: "side" | "center";
  widthClassName?: string;
  /** "glass" (default) is the existing cream-tinted glass-panel look used by
   * every other modal — untouched. "solid" is a plain white panel with a
   * hairline border, for surfaces that need to read as flat/editorial
   * rather than translucent. */
  panelVariant?: "glass" | "solid";
}

export function ResponsiveSheet({
  open,
  onClose,
  title,
  children,
  desktopVariant = "side",
  widthClassName = "w-[440px]",
  panelVariant = "glass",
}: ResponsiveSheetProps) {
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const panelVariants = isDesktop
    ? desktopVariant === "side"
      ? {
          hidden: { x: "100%", opacity: 0.4 },
          visible: { x: 0, opacity: 1 },
        }
      : {
          hidden: { scale: 0.95, opacity: 0 },
          visible: { scale: 1, opacity: 1 },
        }
    : {
        hidden: { y: "100%" },
        visible: { y: 0 },
      };

  const placementClasses = isDesktop
    ? desktopVariant === "side"
      ? cn("fixed right-0 top-0 h-full", widthClassName)
      : "fixed inset-0 flex items-center justify-center p-6"
    : "fixed inset-x-0 bottom-0 max-h-[86vh]";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className={placementClasses}>
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={panelVariants}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
              className={cn(
                "relative flex flex-col overflow-hidden",
                panelVariant === "solid" ? "bg-white border border-[#E5E5E5]" : "glass-panel",
                isDesktop && desktopVariant === "center"
                  ? cn("rounded-2xl max-h-[86vh]", widthClassName)
                  : isDesktop
                    ? "h-full"
                    : "w-full rounded-t-2xl max-h-[86vh]"
              )}
            >
              <div className={cn("flex items-center justify-between px-5 py-4 border-b shrink-0", panelVariant === "solid" ? "border-[#E5E5E5]" : "border-line-soft")}>
                <div className="text-sm font-semibold text-ink-0 font-display tracking-wide">{title}</div>
                <button
                  onClick={onClose}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-ink-300 hover:text-ink-0 hover:bg-black/5 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto no-scrollbar flex-1 min-h-0">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
