"use client";

/**
 * Beautiful skeleton loading components with shimmer animation.
 * Use these to provide visual feedback during data fetching.
 */

const shimmerClass =
    "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-linear-to-r before:from-transparent before:via-white/60 before:to-transparent";

/** Base skeleton block with customizable dimensions */
export const Skeleton = ({
    className = "",
    width,
    height,
}: {
    className?: string;
    width?: string;
    height?: string;
}) => (
    <div
        className={`rounded-md bg-linear-to-r from-emerald-100 to-emerald-50 ${shimmerClass} ${className}`}
        style={{ width, height }}
    />
);

/** Skeleton for text lines */
export const SkeletonText = ({
    lines = 1,
    className = "",
}: {
    lines?: number;
    className?: string;
}) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <div
                key={i}
                className={`h-4 rounded-md bg-linear-to-r from-emerald-100 to-emerald-50 ${shimmerClass} ${i === lines - 1 ? "w-3/4" : "w-full"
                    }`}
            />
        ))}
    </div>
);

/** Skeleton for stat cards with icon placeholder */
export const SkeletonStatCard = () => (
    <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
            <div
                className={`h-10 w-10 rounded-xl bg-linear-to-br from-emerald-100 to-emerald-50 ${shimmerClass}`}
            />
            <div className="flex-1 space-y-2">
                <div className={`h-3 w-20 rounded bg-emerald-100 ${shimmerClass}`} />
                <div className={`h-6 w-16 rounded bg-emerald-100 ${shimmerClass}`} />
            </div>
        </div>
    </div>
);

/** Skeleton for stat cards grid */
export const SkeletonStatsGrid = ({ count = 6 }: { count?: number }) => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonStatCard key={i} />
        ))}
    </div>
);

/** Skeleton for table rows */
export const SkeletonTableRow = ({ columns = 5 }: { columns?: number }) => (
    <tr>
        {Array.from({ length: columns }).map((_, i) => (
            <td key={i} className="px-3 py-3">
                <div
                    className={`h-4 rounded bg-linear-to-r from-emerald-100 to-emerald-50 ${shimmerClass} ${i === 0 ? "w-24" : i === columns - 1 ? "w-16" : "w-12"
                        }`}
                />
            </td>
        ))}
    </tr>
);

/** Skeleton for full table */
export const SkeletonTable = ({
    rows = 5,
    columns = 5,
}: {
    rows?: number;
    columns?: number;
}) => (
    <div className="overflow-hidden rounded-xl border border-emerald-100 shadow-sm">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-emerald-100 text-sm">
                <thead className="bg-emerald-50/80">
                    <tr>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i} className="px-3 py-3">
                                <div
                                    className={`h-3 rounded bg-emerald-200/50 ${shimmerClass} ${i === 0 ? "w-20" : "w-12"
                                        }`}
                                />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50 bg-white">
                    {Array.from({ length: rows }).map((_, i) => (
                        <SkeletonTableRow key={i} columns={columns} />
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

/** Skeleton for property card */
export const SkeletonPropertyCard = () => (
    <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
                <div className={`h-5 w-32 rounded bg-emerald-100 ${shimmerClass}`} />
                <div className={`h-3 w-48 rounded bg-emerald-50 ${shimmerClass}`} />
            </div>
            <div className="flex items-center gap-2">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={`h-8 w-8 rounded-lg bg-emerald-100 ${shimmerClass}`}
                    />
                ))}
                <div className={`h-8 w-20 rounded-lg bg-emerald-100 ${shimmerClass}`} />
            </div>
        </div>
    </div>
);

/** Skeleton for properties list */
export const SkeletonPropertiesList = ({ count = 4 }: { count?: number }) => (
    <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonPropertyCard key={i} />
        ))}
    </div>
);

/** Skeleton for properties summary cards */
export const SkeletonPropertiesSummary = () => (
    <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="space-y-3">
            <div className={`h-4 w-48 rounded bg-emerald-100 ${shimmerClass}`} />
            <div className={`h-3 w-64 rounded bg-emerald-50 ${shimmerClass}`} />
            <div className="mt-3 grid gap-3 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3"
                    >
                        <div className={`h-3 w-16 rounded bg-emerald-200/50 ${shimmerClass}`} />
                        <div className={`mt-2 h-6 w-10 rounded bg-emerald-100 ${shimmerClass}`} />
                        <div className="mt-2 flex gap-1">
                            {[1, 2, 3].map((j) => (
                                <div
                                    key={j}
                                    className={`h-5 w-8 rounded-full bg-emerald-100 ${shimmerClass}`}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

/** Skeleton for chart/pie chart area */
export const SkeletonChart = () => (
    <div className="flex flex-col items-center justify-center py-8">
        <div
            className={`h-48 w-48 rounded-full bg-linear-to-br from-emerald-100 to-emerald-50 ${shimmerClass}`}
        />
        <div className="mt-6 flex flex-wrap justify-center gap-3">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-1.5">
                    <div className={`h-3 w-3 rounded-full bg-emerald-200 ${shimmerClass}`} />
                    <div className={`h-3 w-16 rounded bg-emerald-100 ${shimmerClass}`} />
                </div>
            ))}
        </div>
    </div>
);

/** Skeleton for full section loading */
export const SkeletonSection = ({
    title = true,
    children,
}: {
    title?: boolean;
    children: React.ReactNode;
}) => (
    <div className="rounded-2xl bg-white p-4 md:p-6 shadow-sm ring-1 ring-emerald-100">
        {title && (
            <div className="mb-4 flex items-start gap-3">
                <div className={`h-9 w-9 rounded-full bg-emerald-100 ${shimmerClass}`} />
                <div className="space-y-2">
                    <div className={`h-4 w-32 rounded bg-emerald-100 ${shimmerClass}`} />
                    <div className={`h-3 w-48 rounded bg-emerald-50 ${shimmerClass}`} />
                </div>
            </div>
        )}
        {children}
    </div>
);

/** Pulse animation for simple loading indicator */
export const SkeletonPulse = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse rounded-full bg-emerald-200 ${className}`} />
);
