import { useStore } from "@nanostores/react";
import { toastStore, removeToast, removeAllToasts } from "@/stores/toast";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { AnimatePresence, motion } from "framer-motion";

export const ToastRenderer = () => {
  const toastsByPosition = useStore(toastStore); // ✅ Correct subscription

  return (
    <>
      {Object.entries(toastsByPosition).map(([positionKey, toasts]) => {
        const [y, x] = positionKey.split("-");
        const vertical =
          y === "top"
            ? "top-4"
            : y === "bottom"
              ? "bottom-10"
              : "top-1/2 -translate-y-1/2";
        const horizontal =
          x === "left"
            ? "left-4"
            : x === "right"
              ? "right-6"
              : "left-1/2 -translate-x-1/2";

        return (
          <div
            key={positionKey}
            className={`fixed z-50 space-y-2 ${vertical} ${horizontal}`}
          >
            <Button
              onClick={removeAllToasts}
              className="hidden mb-6 text-xs text-white bg-gray-700 px-2 py-1 rounded hover:bg-gray-600"
            >
              Dismiss All
            </Button>
            <AnimatePresence initial={false}>
              {toasts.map((toast) => (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`relative px-4 py-4 rounded shadow text-white pr-10 max-w-[400px] min-h-[60px] ${
                    toast.type === "success"
                      ? "bg-green-600"
                      : toast.type === "error"
                        ? "bg-red-600"
                        : "bg-sky-500"
                  }`}
                >

                  {toast.message}
                  <Button
                    onClick={() => removeToast(toast.id)}
                    className="absolute right-0 top-0 text-white text-sm hover:opacity-80 border"
                    aria-label="Dismiss toast"
                    variant="outlined"
                  >
                    <Icon icon="mdi:close" width="1.2em" height="1.2em" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        );
      })}
    </>
  );
};
