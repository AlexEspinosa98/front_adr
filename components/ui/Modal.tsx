"use client";

import { ReactNode, useEffect, useCallback } from "react";
import { FiX } from "react-icons/fi";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    /** Optional title for the modal header */
    title?: string;
    /** Size variant for the modal */
    size?: "sm" | "md" | "lg" | "xl" | "full";
    /** Whether to show the close button */
    showCloseButton?: boolean;
    /** Whether clicking the backdrop closes the modal */
    closeOnBackdropClick?: boolean;
}

const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-[90vw] max-h-[90vh]",
};

/**
 * Reusable Modal component with blur backdrop.
 * Closes on ESC key, backdrop click (optional), and X button.
 */
export const Modal = ({
    isOpen,
    onClose,
    children,
    title,
    size = "md",
    showCloseButton = true,
    closeOnBackdropClick = true,
}: ModalProps) => {
    // Close on ESC key
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={closeOnBackdropClick ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Modal content */}
            <div
                className={`relative z-10 w-full ${sizeClasses[size]} animate-in fade-in zoom-in-95 duration-200`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? "modal-title" : undefined}
            >
                <div className="rounded-2xl bg-white shadow-2xl ring-1 ring-emerald-100 overflow-hidden">
                    {/* Header */}
                    {(title || showCloseButton) && (
                        <div className="flex items-center justify-between border-b border-emerald-100 px-4 py-3">
                            {title && (
                                <h2
                                    id="modal-title"
                                    className="text-lg font-semibold text-emerald-900"
                                >
                                    {title}
                                </h2>
                            )}
                            {showCloseButton && (
                                <button
                                    onClick={onClose}
                                    className="ml-auto rounded-lg p-2 text-emerald-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                                    aria-label="Cerrar"
                                >
                                    <FiX size={20} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Body */}
                    <div>{children}</div>
                </div>
            </div>
        </div>
    );
};

interface ImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Image URL to display */
    src: string;
    /** Alt text for the image */
    alt?: string;
}

/**
 * Specialized modal for viewing images in full size.
 * Shows the image centered with optional zoom controls.
 */
export const ImageModal = ({ isOpen, onClose, src, alt = "" }: ImageModalProps) => {
    // Close on ESC key
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop with blur */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Close button - positioned in corner */}
            <button
                onClick={onClose}
                className="fixed right-4 top-4 z-20 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition hover:bg-white/20"
                aria-label="Cerrar"
            >
                <FiX size={24} />
            </button>

            {/* Image container */}
            <div
                className="relative z-10 flex max-h-[90vh] max-w-[90vw] items-center justify-center"
                onClick={onClose}
            >
                <img
                    src={src}
                    alt={alt}
                    className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
};
