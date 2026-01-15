/**
 * Notification Bell Component
 *
 * Displays a bell icon with an unread badge.
 * Opens a dropdown with a list of real-time notifications.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserNotifications } from '@/services/websocket';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn, formatTimeAgo } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { useClickAway } from 'react-use';

interface NotificationBellProps {
    address?: string;
}

export function NotificationBell({ address }: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useUserNotifications(address);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useClickAway(dropdownRef, () => setIsOpen(false));

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative rounded-full p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500"></span>
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900 z-50"
                    >
                        <div className="flex items-center justify-between border-b border-neutral-100 p-4 dark:border-neutral-800">
                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <Bell className="mb-2 h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                                    <p className="text-sm text-neutral-500">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                "relative flex gap-3 p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                                                !notification.read && "bg-blue-50/50 dark:bg-blue-900/10"
                                            )}
                                        >
                                            {/* Image */}
                                            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                                                {notification.image ? (
                                                    <Image
                                                        src={notification.image}
                                                        alt=""
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center">
                                                        <Bell className="h-4 w-4 text-neutral-400" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                                        {notification.title}
                                                    </p>
                                                    <span className="text-xs text-neutral-400 whitespace-nowrap">
                                                        {formatTimeAgo(notification.timestamp)}
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                                                    {notification.message}
                                                </p>

                                                {/* Actions */}
                                                <div className="mt-2 flex items-center gap-3">
                                                    {!notification.read && (
                                                        <button
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                                                        >
                                                            Mark as read
                                                        </button>
                                                    )}
                                                    {notification.link && (
                                                        <Link
                                                            href={notification.link}
                                                            className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                                                            onClick={() => setIsOpen(false)}
                                                        >
                                                            View details
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Unread Indicator */}
                                            {!notification.read && (
                                                <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-primary-500"></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
