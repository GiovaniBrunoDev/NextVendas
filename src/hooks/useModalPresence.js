import { useEffect } from "react";

let modalCount = 0;

export default function useModalPresence(active = true) {
  useEffect(() => {
    if (!active || typeof document === "undefined") return undefined;

    modalCount += 1;
    document.body.classList.add("lojia-modal-open");
    document.body.dataset.lojiaModalOpen = String(modalCount);

    return () => {
      modalCount = Math.max(0, modalCount - 1);
      document.body.dataset.lojiaModalOpen = String(modalCount);

      if (modalCount === 0) {
        document.body.classList.remove("lojia-modal-open");
        delete document.body.dataset.lojiaModalOpen;
      }
    };
  }, [active]);
}
