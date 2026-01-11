import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";

type ToastType = "success" | "error";

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within the system hai ta gaich ToastProvider");
  return context;
};

export const useToastCK = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within the ToastProvider check");
  return context;
};

export const tostContectVal = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = (type: ToastType, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3000
    );
  };

  console.log("Rendering ToastProvider with toasts:", toasts);
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Top-right toast container */}
      <div className="fixed top-5 right-5 flex flex-col gap-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center justify-between px-4 py-2 gap-2 rounded-lg shadow-md text-sm font-medium text-white min-w-[200px] max-w-xs ${
              toast.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
            >
              <X size={14} className="text-gray-800 hover:text-red-500" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
