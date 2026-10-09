"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChefHat,
  Bot,
  Calendar,
  Truck,
  AlertTriangle,
  Check,
  CheckCheck,
  X,
  ExternalLink,
} from "lucide-react";
import { useLanguageStore } from "@/stores/language-store";
import { toast } from "sonner";

export interface WorkshopNotification {
  id: string;
  type: "kds" | "agent" | "reservation" | "delivery" | "inventory";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  href: string;
  priority?: "normal" | "urgent";
}

const INITIAL_NOTIFICATIONS: WorkshopNotification[] = [
  {
    id: "notif-1",
    type: "agent",
    title: "AI Margin Guard Proposal",
    message: "Beef cost increased +12%. Review proposed price adjustment for Kazan Kabob.",
    timestamp: "3m ago",
    isRead: false,
    href: "/agents",
    priority: "urgent",
  },
  {
    id: "notif-2",
    type: "kds",
    title: "Kitchen Delay Warning",
    message: "Order #104 prep time exceeded 15 minutes. Station: Hot Line.",
    timestamp: "8m ago",
    isRead: false,
    href: "/kds",
    priority: "urgent",
  },
  {
    id: "notif-3",
    type: "reservation",
    title: "New Table Booking Request",
    message: "Party of 6 requested Table 4 for tonight at 20:00 (Sherzod M.).",
    timestamp: "24m ago",
    isRead: false,
    href: "/reservations",
    priority: "normal",
  },
  {
    id: "notif-4",
    type: "delivery",
    title: "Courier Picked Up Order",
    message: "Noor Tech courier has picked up order #101. Estimated arrival: 14 mins.",
    timestamp: "42m ago",
    isRead: true,
    href: "/dispatch",
    priority: "normal",
  },
];

export function NotificationCenter() {
  const router = useRouter();
  const { t } = useLanguageStore();
  const [notifications, setNotifications] = useState<WorkshopNotification[]>(INITIAL_NOTIFICATIONS);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read");
  };

  const handleNotificationClick = (notif: WorkshopNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    setIsOpen(false);
    router.push(notif.href);
  };

  const dismissNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    return true;
  });

  const getIcon = (type: WorkshopNotification["type"]) => {
    switch (type) {
      case "kds":
        return <ChefHat className="w-4 h-4 text-orange-400" />;
      case "agent":
        return <Bot className="w-4 h-4 text-purple-400" />;
      case "reservation":
        return <Calendar className="w-4 h-4 text-sky-400" />;
      case "delivery":
        return <Truck className="w-4 h-4 text-emerald-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 rounded-lg bg-[#161b22] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-gray-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer focus:outline-none"
        title={t("header.notifications", "Notifications")}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#f98b25] text-[10px] font-bold text-white shadow-lg animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#161b22] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl overflow-hidden">
          {/* Header */}
          <div className="p-3.5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">
                {t("header.notifications", "Notifications")}
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-[#f98b25]/20 text-[#f98b25]">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#f98b25] transition-colors px-2 py-0.5 rounded hover:bg-white/5"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark read</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Sub-nav */}
          <div className="flex border-b border-[rgba(255,255,255,0.04)] px-3 py-1.5 bg-[#0D1117]/60 text-xs gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                filter === "all"
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                filter === "unread"
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-[rgba(255,255,255,0.04)]">
            {filtered.length > 0 ? (
              filtered.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 transition-colors cursor-pointer group flex items-start gap-3 relative ${
                    !n.isRead
                      ? "bg-[rgba(249,139,37,0.04)] hover:bg-[rgba(249,139,37,0.08)]"
                      : "hover:bg-white/5 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className="p-2 rounded-xl bg-[#0D1117] border border-[rgba(255,255,255,0.06)] shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-white truncate">
                        {n.title}
                      </span>
                      {n.priority === "urgent" && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 uppercase tracking-wider">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500">
                      <span>{n.timestamp}</span>
                      <span>•</span>
                      <span className="text-[#f98b25] group-hover:underline flex items-center gap-0.5 font-medium">
                        Open action <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>

                  {/* Dismiss */}
                  <button
                    onClick={(e) => dismissNotification(e, n.id)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
                    title="Dismiss notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {!n.isRead && (
                    <span className="absolute top-4 right-3.5 w-2 h-2 rounded-full bg-[#f98b25] group-hover:hidden" />
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-gray-500">
                <Check className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                No {filter === "unread" ? "unread " : ""}notifications
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
