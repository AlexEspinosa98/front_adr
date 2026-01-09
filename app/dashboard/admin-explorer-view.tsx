"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Session } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import {
  FiActivity,
  FiBarChart2,
  FiChevronRight,
  FiChevronLeft,
  FiLogOut,
  FiMapPin,
  FiPieChart,
  FiHome,
  FiSearch,
  FiUsers,
  FiCheck,
  FiX,
  FiFileText,
  FiExternalLink,
} from "react-icons/fi";

import {
  Extensionist,
  ExtensionistFilters,
  fetchExtensionistsFull,
} from "@/services/extensionists";
import {
  ExtensionistProperty,
  fetchPropertySurveyVisit,
  fetchExtensionistProperties,
  fetchExtensionistSummary,
  SurveysStateSummaryBucket,
  SurveysStateSummary,
  updateSurveyState,
  basicUpdateSurvey,
  exportExtensionistExcel,
} from "@/services/properties";
import {
  fetchSurveyStatistics,
  fetchSurveySummaryByCity,
  type CitySurveySummary,
  type SummarySurveyBucket,
  exportSurveyExcel,
} from "@/services/statistics";
import { CityChart } from "./charts/CityChart";

type SessionWithToken = Session & { accessToken?: string; tokenType?: string };

const SECTION_CLASS =
  "rounded-2xl bg-white p-6 shadow-sm ring-1 ring-emerald-100 flex flex-col gap-4";

const SectionHeader = ({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) => (
  <div className="flex items-start gap-3">
    <span className="mt-1 rounded-full bg-emerald-100 p-2 text-emerald-600">
      {icon}
    </span>
    <div>
      <p className="text-base font-semibold text-emerald-900">{title}</p>
      <p className="text-sm text-emerald-500">{description}</p>
    </div>
  </div>
);

const SectionCard = ({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) => (
  <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-baseline gap-2">
      <span className="text-lg font-bold text-emerald-900">{number}</span>
      <p className="text-sm font-semibold text-emerald-900">{title}</p>
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

const FieldInput = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  options,
  readOnly = false,
  highlight = false,
}: {
  label: string;
  value?: string | number | null;
  onChange?: (next: string) => void;
  type?: "text" | "textarea" | "select";
  placeholder?: string;
  options?: string[];
  readOnly?: boolean;
  highlight?: boolean;
}) => {
  const baseClasses =
    "w-full rounded-md border border-emerald-100 bg-white px-3 py-2 text-sm text-emerald-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200";
  const disabledClasses = "bg-emerald-50 text-emerald-700 cursor-not-allowed";
  const containerClasses = highlight
    ? "rounded-lg border border-emerald-200 bg-emerald-50/70 p-3"
    : "rounded-lg border border-emerald-50 bg-emerald-50/60 p-3";

  return (
    <div className={containerClasses}>
      <p className="text-xs uppercase tracking-[0.08em] text-emerald-600">
        {label}
      </p>
      {type === "textarea" ? (
        <textarea
          className={`${baseClasses} mt-2 min-h-[96px] ${readOnly ? disabledClasses : ""}`}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
        />
      ) : type === "select" && options ? (
        <select
          className={`${baseClasses} mt-2 ${readOnly ? disabledClasses : ""}`}
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={readOnly}
        >
          <option value="" disabled>
            Selecciona...
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          className={`${baseClasses} mt-2 ${readOnly ? disabledClasses : ""}`}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
        />
      )}
    </div>
  );
};

const DEPARTMENTS = ["Magdalena", "Atlantico"] as const;

const MUNICIPALITIES: Record<(typeof DEPARTMENTS)[number], string[]> = {
  Magdalena: [
    "Cerro San Antonio",
    "Chivolo",
    "Ciénaga",
    "Concordia",
    "El Banco",
    "El Piñon",
    "Fundacion",
    "GUAMAL",
    "Nueva Granada",
    "Pedraza",
    "Pivijay",
    "Plato",
    "Sabana de San Angel",
    "Salamina",
    "San Zenón",
    "Santa Marta",
    "Tenerife",
    "Zapayan",
    "Zona Bananera",
  ],
  Atlantico: [
    "Baranoa",
    "Malambo",
    "Manatí",
    "Palmar De Varela",
    "Sabanalarga",
    "Santa Lucía",
    "Suan",
    "Luruaco",
    "Ponedera",
    "Tubará",
  ],
};

const SUMMARY_DEPARTMENTS = ["Magdalena", "Atlántico"] as const;
const SUMMARY_CITIES: Record<(typeof SUMMARY_DEPARTMENTS)[number], string[]> = {
  Magdalena: [
    "Cerro San Antonio",
    "Chivolo",
    "Ciénaga",
    "Concordia",
    "El Banco",
    "El Piñon",
    "Fundacion",
    "Guamal",
    "Nueva Granada",
    "Pedraza",
    "Pivijay",
    "Plato",
    "Sabana de San Angel",
    "Salamina",
    "San Zenón",
    "Santa Marta",
    "Tenerife",
    "Zapayan",
    "Zona Bananera",
  ],
  "Atlántico": [
    "Baranoa",
    "Malambo",
    "Manatí",
    "Palmar De Varela",
    "Sabanalarga",
    "Santa Lucía",
    "Suan",
    "Luruaco",
    "Ponedera",
    "Tubará",
  ],
};

export const AdminExplorerView = () => {
  const { data: session } = useSession();
  const accessToken = (session as SessionWithToken | null)?.accessToken;
  const tokenType = (session as SessionWithToken | null)?.tokenType ?? "Token";
  const userName = (session?.user?.name as string | undefined)?.trim() ?? "";
  const isCoordinator = userName.toLowerCase() === "coordinador";
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [cityFilter, setCityFilter] = useState<string | undefined>(undefined);
  const [zoneFilter, setZoneFilter] = useState<string | undefined>(undefined);
  const [appliedFilters, setAppliedFilters] = useState<
    Pick<ExtensionistFilters, "name" | "email">
  >({});
  const [selectedExtensionist, setSelectedExtensionist] =
    useState<Extensionist | null>(null);
  const [selectedProperty, setSelectedProperty] =
    useState<ExtensionistProperty | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<number | null>(null);
  const [visitDecision, setVisitDecision] = useState<
    "accepted" | "rejected" | null
  >(null);
  const [showClassificationDetail, setShowClassificationDetail] =
    useState(false);
  const [editableVisit, setEditableVisit] = useState<Record<string, unknown> | null>(
    null,
  );
  const [editableProducer, setEditableProducer] =
    useState<Record<string, unknown> | null>(null);
  const [editableProperty, setEditableProperty] =
    useState<Record<string, unknown> | null>(null);
  const [approvalProfile, setApprovalProfile] = useState("");
  const [decisionReason, setDecisionReason] = useState("");
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateFiles, setUpdateFiles] = useState<{
    photo_user?: File;
    photo_interaction?: File;
    photo_panorama?: File;
    phono_extra_1?: File;
    file_pdf?: File;
  }>({});
  const [summaryDepartment, setSummaryDepartment] =
    useState<(typeof SUMMARY_DEPARTMENTS)[number]>("Magdalena");
  const [summaryCity, setSummaryCity] = useState<string | undefined>(
    SUMMARY_CITIES["Magdalena"][0],
  );
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportDepartment, setExportDepartment] =
    useState<(typeof SUMMARY_DEPARTMENTS)[number]>("Magdalena");
  const [exportCity, setExportCity] = useState<string | undefined>(undefined);
  const [exportError, setExportError] = useState<string | null>(null);
  const [reportCityFilter, setReportCityFilter] = useState<string | undefined>(undefined);
  const [reportZoneFilter, setReportZoneFilter] = useState<string | undefined>(undefined);
  const [reportSearch, setReportSearch] = useState("");
  const [reportPage, setReportPage] = useState(1);
  const [reportExpandedPropertyId, setReportExpandedPropertyId] = useState<number | null>(null);
  const [reportExporting, setReportExporting] = useState(false);
  const [reportExportError, setReportExportError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"stats" | "visits" | "reports">("stats");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedPropertyId, setExpandedPropertyId] = useState<number | null>(
    null,
  );
  const [propertySearch, setPropertySearch] = useState("");
  const [propertyPage, setPropertyPage] = useState(1);
  const {
    data: statsResponse,
    isLoading: statsLoading,
    isError: statsError,
    isFetching: statsFetching,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["survey-statistics", accessToken],
    queryFn: () => fetchSurveyStatistics(accessToken),
    enabled: Boolean(accessToken),
  });

  const applyFiltersAndReset = ({
    cityOverride,
    zoneOverride,
  }: { cityOverride?: string | undefined; zoneOverride?: string | undefined } = {}) => {
    const cityValue = cityOverride ?? (cityFilter?.trim() || undefined);
    const zoneValue = zoneOverride ?? (zoneFilter?.trim() || undefined);
    setCityFilter(cityValue);
    setZoneFilter(zoneValue);
    setAppliedFilters({
      name: nameInput.trim() || undefined,
      email: emailInput.trim() || undefined,
    });
    setCurrentPage(1);
    setSelectedExtensionist(null);
    setSelectedProperty(null);
    setSelectedVisit(null);
    setVisitDecision(null);
    setShowClassificationDetail(false);
    setEditableVisit(null);
    setEditableProducer(null);
    setEditableProperty(null);
    setApprovalProfile("");
    setDecisionReason("");
    setDecisionError(null);
    setUpdateMessage(null);
    setUpdateError(null);
    setUpdateFiles({});
    setExpandedPropertyId(null);
    setReportExpandedPropertyId(null);
    setPropertySearch("");
    setPropertyPage(1);
  };

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyFiltersAndReset();
  };

  const {
    data: extensionistsResponse,
    isLoading: extensionistsLoading,
    isError: extensionistsError,
    error: extensionistsFetchError,
    refetch: refetchExtensionists,
    isFetching: extensionistsFetching,
  } = useQuery({
    queryKey: ["extensionists-full", appliedFilters, accessToken, tokenType],
    queryFn: () =>
      fetchExtensionistsFull(appliedFilters, accessToken, tokenType),
    enabled: Boolean(accessToken),
  });

  const extensionists = extensionistsResponse?.data ?? [];
  const availableCities = Array.from(
    new Set(extensionists.map((item) => item.city).filter(Boolean) as string[]),
  );
  const availableZones = Array.from(
    new Set(extensionists.map((item) => item.zone).filter(Boolean) as string[]),
  );
  const filteredReportExtensionists = extensionists.filter((ext) => {
    const matchesCity = reportCityFilter ? ext.city === reportCityFilter : true;
    const matchesZone = reportZoneFilter ? ext.zone === reportZoneFilter : true;
    const matchesName = reportSearch
      ? ext.name.toLowerCase().includes(reportSearch.toLowerCase().trim())
      : true;
    return matchesCity && matchesZone && matchesName;
  });
  const reportPageSize = 10;
  const reportTotalPages = Math.max(
    1,
    Math.ceil(filteredReportExtensionists.length / reportPageSize),
  );
  const reportCurrentPageSafe = Math.min(reportPage, reportTotalPages);
  const paginatedReportExtensionists = filteredReportExtensionists.slice(
    (reportCurrentPageSafe - 1) * reportPageSize,
    reportCurrentPageSafe * reportPageSize,
  );
  const visitTotalsByType = ["survey_1", "survey_2", "survey_3"].reduce<
    Record<"survey_1" | "survey_2" | "survey_3", { pending: number; accepted: number; rejected: number }>
  >(
    (acc, key) => {
      acc[key as "survey_1" | "survey_2" | "survey_3"] = { pending: 0, accepted: 0, rejected: 0 };
      return acc;
    },
    {} as any,
  );
  filteredReportExtensionists.forEach((ext) => {
    (["survey_1", "survey_2", "survey_3"] as const).forEach((key) => {
      const bucket = ext.surveys_state_summary?.[key];
      if (bucket) {
        visitTotalsByType[key].pending += bucket.pending ?? 0;
        visitTotalsByType[key].accepted += bucket.accepted ?? 0;
        visitTotalsByType[key].rejected += bucket.rejected ?? 0;
      }
    });
  });
  const summaryCityOptions = SUMMARY_CITIES[summaryDepartment] ?? [];
  const selectedSummaryCity =
    summaryCityOptions.find((city) => city === summaryCity) ??
    summaryCityOptions[0] ??
    "";
  const exportCityOptions = SUMMARY_CITIES[exportDepartment] ?? [];
  const selectedExportCity = exportCity ?? "";
  const filteredExtensionists = extensionists.filter((ext) => {
    const matchesCity = cityFilter ? ext.city === cityFilter : true;
    const matchesZone = zoneFilter ? ext.zone === zoneFilter : true;
    return matchesCity && matchesZone;
  });
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredExtensionists.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedExtensionists = filteredExtensionists.slice(
    (currentPageSafe - 1) * pageSize,
    currentPageSafe * pageSize,
  );
  const goToPage = (page: number) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(clamped);
  };

  const {
    data: extensionistSummaryResponse,
    isLoading: propertiesLoading,
    isError: propertiesError,
    error: propertiesFetchError,
    isFetching: propertiesFetching,
  } = useQuery({
    queryKey: [
      "extensionist-summary",
      selectedExtensionist?.id,
      accessToken,
      tokenType,
    ],
    queryFn: () =>
      fetchExtensionistSummary(selectedExtensionist!.id, accessToken, tokenType),
    enabled: Boolean(selectedExtensionist && accessToken),
  });

  const {
    data: surveyVisitResponse,
    isLoading: surveyVisitLoading,
    isError: surveyVisitError,
    error: surveyVisitFetchError,
    isFetching: surveyVisitFetching,
    refetch: refetchSurveyVisit,
  } = useQuery({
    queryKey: [
      "property-survey-visit",
      selectedProperty?.id,
      selectedVisit,
      accessToken,
      tokenType,
    ],
    queryFn: () =>
      fetchPropertySurveyVisit(
        selectedProperty!.id,
        selectedVisit!,
        accessToken,
        tokenType,
      ),
    enabled: Boolean(selectedProperty && selectedVisit && accessToken),
  });

  const {
    data: citySummaryResponse,
    isLoading: citySummaryLoading,
    isError: citySummaryError,
    error: citySummaryFetchError,
    refetch: refetchCitySummary,
  } = useQuery({
    queryKey: ["survey-summary-city", summaryCity, accessToken, tokenType],
    queryFn: () =>
      fetchSurveySummaryByCity(summaryCity ?? "", accessToken, tokenType),
    enabled: Boolean(summaryCity && accessToken),
  });
  const citySummary: CitySurveySummary | undefined = citySummaryResponse?.data;
  const { mutateAsync: mutateExport, isPending: exportLoading } = useMutation({
    mutationFn: exportSurveyExcel,
  });

  const summaryData = extensionistSummaryResponse?.data;
  const properties = (summaryData?.properties ?? []).map((prop) => {
    const countStates = (states?: string[]) =>
      (states ?? []).reduce(
        (acc, state) => {
          if (state === "pending") acc.pending += 1;
          if (state === "accepted") acc.accepted += 1;
          if (state === "rejected") acc.rejected += 1;
          return acc;
        },
        { pending: 0, accepted: 0, rejected: 0 },
      );
    const bucket1 = countStates((prop as any)?.surveys?.type_1?.states);
    const bucket2 = countStates((prop as any)?.surveys?.type_2?.states);
    const bucket3 = countStates((prop as any)?.surveys?.type_3?.states);
    return {
      id: prop.id,
      name: prop.name,
      city: prop.city,
      municipality: prop.municipality,
      state: prop.state,
      village: prop.village,
      primaryLine: (prop as any).linea_productive_primary,
      secondaryLine: (prop as any).linea_productive_secondary,
      areaInProduction: (prop as any).area_in_production,
      latitude: (prop as any).latitude,
      longitude: (prop as any).longitude,
      createdAt: (prop as any).created_at,
      surveysStateSummary: {
        survey_1: bucket1,
        survey_2: bucket2,
        survey_3: bucket3,
      } as SurveysStateSummary,
    } as ExtensionistProperty;
  });
  const basePropertiesSummary: SurveysStateSummary = {
    survey_1: { pending: 0, accepted: 0, rejected: 0 },
    survey_2: { pending: 0, accepted: 0, rejected: 0 },
    survey_3: { pending: 0, accepted: 0, rejected: 0 },
  };
  const propertiesSummary =
    summaryData?.states_summary ??
    properties.reduce<SurveysStateSummary>((acc, prop) => {
      (["survey_1", "survey_2", "survey_3"] as const).forEach((key) => {
        const bucket = prop.surveysStateSummary?.[key];
        acc[key] = {
          pending: (acc[key]?.pending ?? 0) + (bucket?.pending ?? 0),
          accepted: (acc[key]?.accepted ?? 0) + (bucket?.accepted ?? 0),
          rejected: (acc[key]?.rejected ?? 0) + (bucket?.rejected ?? 0),
        };
      });
      return acc;
    }, basePropertiesSummary);
  const filteredProperties = properties.filter((property) =>
    property.name.toLowerCase().includes(propertySearch.toLowerCase().trim()),
  );
  const propertiesPageSize = 5;
  const propertiesTotalPages = Math.max(
    1,
    Math.ceil(filteredProperties.length / propertiesPageSize),
  );
  const currentPropertyPageSafe = Math.min(propertyPage, propertiesTotalPages);
  const paginatedProperties = filteredProperties.slice(
    (currentPropertyPageSafe - 1) * propertiesPageSize,
    currentPropertyPageSafe * propertiesPageSize,
  );

  const surveyStats = statsResponse?.data;
  const totals = surveyStats?.total_visits;
  const propertiesTotals = surveyStats?.properties;
  const extensionistsUnique = surveyStats?.extensionists?.unique_total ?? 0;
  const statCards = [
    {
      label: "Visita 1 (inicial)",
      value: totals?.survey_1 ?? 0,
      hint: "",
      icon: <FiBarChart2 aria-hidden />,
    },
    {
      label: "Visita 2 (seguimiento)",
      value: totals?.survey_2 ?? 0,
      hint: "",
      icon: <FiPieChart aria-hidden />,
    },
    {
      label: "Visita 3 (final)",
      value: totals?.survey_3 ?? 0,
      hint: "",
      icon: <FiActivity aria-hidden />,
    },
    {
      label: "Total de visitas",
      value: totals?.all_types ?? 0,
      hint: "",
      icon: <FiHome aria-hidden />,
    },
    {
      label: "Extensionistas únicos",
      value: extensionistsUnique,
      hint: "",
      icon: <FiUsers aria-hidden />,
    },
    {
      label: "Propiedades Mag/Atl",
      value:
        (propertiesTotals?.total_magdalena_atlantico ??
          ((propertiesTotals?.magdalena ?? 0) + (propertiesTotals?.atlantico ?? 0))) ?? 0,
      hint: "",
      icon: <FiMapPin aria-hidden />,
    },
  ];
  const departmentRows = surveyStats?.by_department ?? [];
  const topCities =
    surveyStats?.by_city
      ?.sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
      ?.slice(0, 8)
      ?.map((item) => ({ value: item.city, count: item.total })) ?? [];

  const handleLogout = () => {
    window.localStorage.removeItem("access_token");
    signOut({ callbackUrl: "/login" });
  };

  useEffect(() => {
    if (isCoordinator && activeView === "visits") {
      setActiveView("stats");
    }
  }, [isCoordinator, activeView]);

  useEffect(() => {
    if (activeView === "stats" && accessToken) {
      void refetchStats();
    }
  }, [activeView, accessToken, refetchStats]);

  const handleExtensionistSelect = (extensionist: Extensionist) => {
    setSelectedExtensionist(extensionist);
    setExpandedPropertyId(null);
    setReportExpandedPropertyId(null);
    setSelectedProperty(null);
    setSelectedVisit(null);
    setVisitDecision(null);
    setShowClassificationDetail(false);
    setEditableVisit(null);
    setEditableProducer(null);
    setEditableProperty(null);
    setApprovalProfile("");
    setDecisionReason("");
    setDecisionError(null);
    setUpdateMessage(null);
    setUpdateError(null);
    setUpdateFiles({});
    setPropertySearch("");
    setPropertyPage(1);
  };

  const renderListState = useCallback(
    ({
      isLoading,
      isFetching,
      isError,
      errorMessage,
      emptyLabel,
    }: {
      isLoading: boolean;
      isFetching?: boolean;
      isError: boolean;
      errorMessage?: string;
      emptyLabel: string;
    }) => {
      if (isLoading || isFetching) {
        return (
          <p className="text-sm text-emerald-500">
            Consultando información. Por favor espera...
          </p>
        );
      }

      if (isError) {
        return (
          <p className="text-sm text-red-600">
            {errorMessage ?? "No fue posible completar la solicitud."}
          </p>
        );
      }

      return <p className="text-sm text-emerald-500">{emptyLabel}</p>;
    },
    [],
  );

  const formatDate = (value?: string | null) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
  };

  const formatDateWithTime = (date?: string | null, time?: string | null) => {
    if (!date) return undefined;
    const parsed = new Date(date);
    const datePart = Number.isNaN(parsed.getTime())
      ? date
      : parsed.toLocaleDateString();
    return time ? `${datePart} ${time}`.trim() : datePart;
  };

  const prettifyKey = (key: string) =>
    key
      .split("_")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ")
      .replace("Ict", "ICT");
  const getVisitCount = (extensionist: Extensionist, key: "survey_1" | "survey_2" | "survey_3") => {
    const bucket = extensionist.surveys_state_summary?.[key];
    const pending = bucket?.pending ?? 0;
    const accepted = bucket?.accepted ?? 0;
    const rejected = bucket?.rejected ?? 0;
    return pending + accepted + rejected;
  };
  const renderVisitStates = (
    extensionist: Extensionist,
    key: "survey_1" | "survey_2" | "survey_3",
  ) => {
    const bucket = extensionist.surveys_state_summary?.[key] ?? {};
    const pending = bucket.pending ?? 0;
    const accepted = bucket.accepted ?? 0;
    const rejected = bucket.rejected ?? 0;
    return (
      <div className="flex flex-wrap gap-1">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
          P: {pending}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
          A: {accepted}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
          R: {rejected}
        </span>
      </div>
    );
  };

  const renderPropertyVisitStates = (
    summary?: SurveysStateSummaryBucket,
  ) => {
    const pending = summary?.pending ?? 0;
    const accepted = summary?.accepted ?? 0;
    const rejected = summary?.rejected ?? 0;
    return (
      <div className="flex flex-wrap gap-1">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
          P: {pending}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-800">
          A: {accepted}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700">
          R: {rejected}
        </span>
      </div>
    );
  };

  const StatCard = ({
    label,
    value,
    hint,
    icon,
  }: {
    label: string;
    value: number | string;
    hint?: string;
    icon: ReactNode;
  }) => (
    <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
      <span className="rounded-full bg-emerald-50 p-3 text-emerald-600">
        {icon}
      </span>
      <div>
        <p className="text-sm text-emerald-500">{label}</p>
        <p className="text-2xl font-semibold text-emerald-900">{value}</p>
        {hint ? <p className="text-xs text-emerald-500">{hint}</p> : null}
      </div>
    </div>
  );

  const surveyVisitData = surveyVisitResponse?.data;
  const visitDetail = surveyVisitData?.surveys?.[0];
  const visitPropertyData =
    (surveyVisitData?.property as ExtensionistProperty | undefined) ??
    selectedProperty;
  const visitProducer = surveyVisitData?.producer as
    | Record<string, unknown>
    | undefined;
  const visitExtensionist = visitDetail?.extensionist as
    | Record<string, unknown>
    | undefined;
  const classificationEntries = Object.entries(
    visitDetail?.classification_user?.detail ?? {},
  );
  const classificationTotal = visitDetail?.classification_user?.total;
  const focalizationEntries = Object.entries(
    visitDetail?.medition_focalization ?? {},
  );
  const photoGallery = (
    [
    { label: "Foto del productor", url: visitDetail?.photo_user },
    { label: "Foto de interacción", url: visitDetail?.photo_interaction },
    { label: "Panorama", url: visitDetail?.photo_panorama },
    { label: "Foto adicional", url: visitDetail?.phono_extra_1 },
    ] as const
  )
    .filter((photo) => Boolean(photo.url))
    .map((photo) => ({ label: photo.label as string, url: photo.url as string }));

  useEffect(() => {
    if (visitDetail) {
      setEditableVisit({
        ...visitDetail,
        origen_register: (visitDetail as any)?.origen_register ?? "app_movil",
        attended_by: (visitDetail as any)?.attended_by ?? "Usuario Productor",
      });
      setApprovalProfile(
        ((visitDetail as any)?.approval_profile as string | undefined) ?? "",
      );
    } else {
      setEditableVisit(null);
      setApprovalProfile("");
    }
    setUpdateMessage(null);
    setUpdateError(null);
    setUpdateFiles({});
  }, [visitDetail]);

  useEffect(() => {
    setEditableProducer(
      visitProducer ? (visitProducer as Record<string, unknown>) : null,
    );
  }, [visitProducer]);

  useEffect(() => {
    setEditableProperty(
      visitPropertyData ? (visitPropertyData as unknown as Record<string, unknown>) : null,
    );
  }, [visitPropertyData]);

  const clearUpdateFeedback = () => {
    setUpdateMessage(null);
    setUpdateError(null);
  };

  const updateVisitField = (key: string, value: string) => {
    clearUpdateFeedback();
    setEditableVisit((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateProducerField = (key: string, value: string) => {
    clearUpdateFeedback();
    setEditableProducer((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updatePropertyField = (key: string, value: string) => {
    clearUpdateFeedback();
    setEditableProperty((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const cleanPayload = (data?: Record<string, unknown> | null) => {
    if (!data) return undefined;
    const output: Record<string, unknown> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined) return;
      if (typeof value === "string" && value.trim() === "") {
        output[key] = null;
        return;
      }
      output[key] = value;
    });
    return Object.keys(output).length > 0 ? output : undefined;
  };

  const buildSurveyPayload = () => {
    if (!editableVisit) return undefined;
    const source = editableVisit as Record<string, unknown>;
    const allowedKeys = [
      "objetive_accompaniment",
      "initial_diagnosis",
      "recommendations_commitments",
      "observations_visited",
      "compliance_status",
      "visit_date",
      "date_acompanamiento",
      "hour_acompanamiento",
      "date_hour_end",
      "origen_register",
      "name_acompanamiento",
      "attended_by",
      "attendee_role",
      "state",
      "photo_user",
      "photo_interaction",
      "photo_panorama",
      "phono_extra_1",
      "file_pdf",
    ];
    const payload: Record<string, unknown> = {};
    allowedKeys.forEach((key) => {
      if (key in source) {
        payload[key] = source[key];
      }
    });
    return cleanPayload(payload);
  };

  const buildProducerPayload = () => {
    if (!editableProducer) return undefined;
    const source = editableProducer as Record<string, unknown>;
    const payload: Record<string, unknown> = {};
    ["name", "type_id", "identification", "number_phone"].forEach((key) => {
      if (key in source) {
        payload[key] = source[key];
      }
    });
    return cleanPayload(payload);
  };

  const buildPropertyPayload = () => {
    if (!editableProperty) return undefined;
    const source = editableProperty as Record<string, unknown>;
    const mapping: Record<string, string[]> = {
      name: ["name"],
      latitude: ["latitude"],
      longitude: ["longitude"],
      asnm: ["asnm"],
      state: ["state"],
      city: ["city", "municipality"],
      municipality: ["municipality", "city"],
      village: ["village"],
      linea_productive_primary: ["linea_productive_primary", "primaryLine"],
      linea_productive_secondary: ["linea_productive_secondary", "secondaryLine"],
      area_in_production: ["area_in_production", "areaInProduction"],
    };
    const payload: Record<string, unknown> = {};
    Object.entries(mapping).forEach(([target, candidates]) => {
      const value = candidates
        .map((key) => source[key])
        .find(
          (item) =>
            item !== undefined &&
            item !== null &&
            !(typeof item === "string" && item.trim() === ""),
        );
      if (value !== undefined) {
        payload[target] = value;
      }
    });
    return cleanPayload(payload);
  };

  const handleFileChange = (
    key: keyof typeof updateFiles,
    files: FileList | null,
  ) => {
    clearUpdateFeedback();
    const file = files?.[0];
    setUpdateFiles((prev) => ({ ...prev, [key]: file || undefined }));
  };
  const selectedDepartment = (editableProperty as any)?.state as
    | (typeof DEPARTMENTS)[number]
    | undefined;
  const availableMunicipalities =
    MUNICIPALITIES[selectedDepartment ?? "Magdalena"] ?? [];
  const { mutateAsync: mutateSurveyState, isPending: decisionLoading } = useMutation({
    mutationFn: updateSurveyState,
  });
  const { mutateAsync: mutateBasicUpdate, isPending: updatingVisit } = useMutation({
    mutationFn: basicUpdateSurvey,
  });

  const handleDecisionSubmit = async (state: "accepted" | "rejected") => {
    if (!approvalProfile.trim()) {
      setDecisionError("Agrega el perfil antes de aceptar o rechazar.");
      return;
    }
    if (!selectedVisit || !visitDetail?.id) {
      setDecisionError("No hay visita cargada para actualizar.");
      return;
    }
    setDecisionError(null);
    try {
      const response = await mutateSurveyState({
        surveyTypeId: selectedVisit,
        surveyId: visitDetail.id,
        state,
        stateReason: decisionReason || undefined,
        perfil: approvalProfile.trim(),
        token: accessToken,
        tokenType,
      });
      if (response?.data) {
        setEditableVisit(response.data as Record<string, unknown>);
        setVisitDecision(state);
      }
      refetchSurveyVisit();
    } catch (error: any) {
      const message =
        (error?.response?.data as any)?.message ??
        error?.message ??
        "No fue posible actualizar el estado.";
      setDecisionError(message);
    }
  };

  const handleBasicUpdate = async () => {
    if (!selectedVisit || !visitDetail?.id) {
      setUpdateError("Selecciona una visita antes de guardar cambios.");
      return;
    }
    if (!accessToken) {
      setUpdateError("No hay sesión válida para actualizar.");
      return;
    }
    const surveyPayload = buildSurveyPayload();
    const producerPayload = buildProducerPayload();
    const propertyPayload = buildPropertyPayload();
    const hasFiles = Object.values(updateFiles).some(Boolean);
    if (!surveyPayload && !producerPayload && !propertyPayload && !hasFiles) {
      setUpdateError("No hay cambios para enviar.");
      return;
    }
    setUpdateError(null);
    setUpdateMessage(null);
    try {
      const response = await mutateBasicUpdate({
        surveyTypeId: selectedVisit,
        surveyId: visitDetail.id,
        surveyData: surveyPayload,
        producterData: producerPayload,
        propertyData: propertyPayload,
        files: updateFiles,
        token: accessToken,
        tokenType,
      });
      if (response?.data) {
        setEditableVisit(response.data as Record<string, unknown>);
      }
      if (producerPayload) {
        setEditableProducer((prev) =>
          prev ? { ...prev, ...producerPayload } : prev,
        );
      }
      if (propertyPayload) {
        setEditableProperty((prev) =>
          prev ? { ...prev, ...propertyPayload } : prev,
        );
      }
      setUpdateFiles({});
      setUpdateMessage("Encuesta actualizada correctamente (sin clasificación).");
      await refetchSurveyVisit();
    } catch (error: any) {
      const message =
        (error?.response?.data as any)?.message ??
        error?.message ??
        "No fue posible actualizar la encuesta.";
      setUpdateError(message);
    }
  };

  const handleExport = async () => {
    if (!accessToken) {
      setExportError("No hay sesión válida.");
      return;
    }
    setExportError(null);
    try {
      const blob = await mutateExport({
        state: exportDepartment,
        city: exportCity || undefined,
        token: accessToken,
        tokenType,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "resumen_encuestas.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setExportModalOpen(false);
    } catch (error: any) {
      const message =
        (error?.response?.data as any)?.message ??
        error?.message ??
        "No fue posible descargar el Excel.";
      setExportError(message);
    }
  };
  return (
    <div className="flex min-h-screen bg-emerald-50">
      <aside className="hidden w-64 shrink-0 flex-col gap-2 bg-white p-6 shadow-sm ring-1 ring-emerald-100 lg:flex">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            Navegación
          </p>
          <h2 className="text-lg font-semibold text-emerald-900">
            Panel principal
          </h2>
        </div>
        <nav className="space-y-2">
          <button
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
              activeView === "stats"
                ? "bg-emerald-900 text-white"
                : "text-emerald-900 hover:bg-emerald-50"
            }`}
            onClick={() => setActiveView("stats")}
            type="button"
          >
            <FiBarChart2
              className={activeView === "stats" ? "text-white" : "text-emerald-500"}
              aria-hidden
            />
            Estadística
          </button>
          {!isCoordinator ? (
            <button
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                activeView === "visits"
                  ? "bg-emerald-900 text-white"
                  : "text-emerald-900 hover:bg-emerald-50"
              }`}
              onClick={() => setActiveView("visits")}
              type="button"
            >
              <FiActivity
                className={
                  activeView === "visits" ? "text-white" : "text-emerald-500"
                }
                aria-hidden
              />
              Revisión de visitas
            </button>
          ) : null}
          <button
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
              activeView === "reports"
                ? "bg-emerald-900 text-white"
                : "text-emerald-900 hover:bg-emerald-50"
            }`}
            onClick={() => setActiveView("reports")}
            type="button"
          >
            <FiUsers
              className={
                activeView === "reports" ? "text-white" : "text-emerald-500"
              }
              aria-hidden
            />
            Reporte de extensionista
          </button>
        </nav>
      </aside>

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <header className="rounded-3xl bg-gradient-to-br from-emerald-900 to-emerald-800 p-8 text-white shadow-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">
                  Flujo administrativo
                </p>
                <h1 className="mt-4 text-3xl font-semibold">
                  {activeView === "stats"
                    ? "Resumen estadístico de encuestas"
                    : activeView === "visits"
                      ? "Revisión de extensionistas"
                      : "Reporte de extensionista"}
                </h1>
                <p className="mt-3 text-base text-emerald-200">
                  {activeView === "stats"
                    ? "Explora totales, cobertura y top extensionistas."
                    : activeView === "visits"
                      ? "Busca extensionistas registrados y revisa sus datos básicos."
                      : "Consulta el resumen de extensionistas y sus visitas."}
                </p>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                onClick={handleLogout}
                type="button"
              >
                <FiLogOut aria-hidden />
                Cerrar sesión
              </button>
            </div>
          </header>

          {activeView === "stats" ? (
            <section
              className={`${SECTION_CLASS} bg-gradient-to-b from-white to-emerald-50/50`}
            >
              <SectionHeader
                icon={<FiBarChart2 aria-hidden />}
                title="Resumen estadístico"
                description="Visión rápida de las encuestas y su cobertura."
              />
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300"
                  onClick={() => refetchStats()}
                  disabled={!accessToken || statsLoading || statsFetching}
                >
                  Actualizar
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300"
                  onClick={() => setExportModalOpen(true)}
                  disabled={!accessToken}
                >
                  <FiFileText aria-hidden />
                  Exportar Excel
                </button>
              </div>

              {statsLoading ? (
                <p className="text-sm text-emerald-500">Cargando estadísticas…</p>
              ) : statsError ? (
                <p className="text-sm text-red-600">
                  No fue posible obtener las estadísticas. Verifica tu sesión.
                </p>
              ) : surveyStats ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {statCards.map((card) => (
                      <StatCard key={card.label} {...card} />
                    ))}
                  </div>

                  <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-emerald-900">
                      Resumen general
                    </p>
                    <p className="text-xs text-emerald-500">
                      Totales de visitas y propiedades
                    </p>
                    <div className="mt-3 overflow-x-auto">
                      <table className="min-w-full divide-y divide-emerald-100 text-sm">
                        <thead className="bg-emerald-50/80 text-emerald-600">
                          <tr className="text-left">
                            <th className="px-3 py-2 font-semibold">Concepto</th>
                            <th className="px-3 py-2 font-semibold">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-50">
                          <tr>
                            <td className="px-3 py-2 text-emerald-900">Visita 1</td>
                            <td className="px-3 py-2 font-semibold text-emerald-900">
                              {totals?.survey_1 ?? 0}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-emerald-900">Visita 2</td>
                            <td className="px-3 py-2 font-semibold text-emerald-900">
                              {totals?.survey_2 ?? 0}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-emerald-900">Visita 3</td>
                            <td className="px-3 py-2 font-semibold text-emerald-900">
                              {totals?.survey_3 ?? 0}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-emerald-900">Total visitas</td>
                            <td className="px-3 py-2 font-semibold text-emerald-900">
                              {totals?.all_types ?? 0}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-emerald-900">Propiedades Magdalena</td>
                            <td className="px-3 py-2 font-semibold text-emerald-900">
                              {propertiesTotals?.magdalena ?? 0}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-emerald-900">Propiedades Atlántico</td>
                            <td className="px-3 py-2 font-semibold text-emerald-900">
                              {propertiesTotals?.atlantico ?? 0}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-emerald-900">Total Mag + Atl</td>
                            <td className="px-3 py-2 font-semibold text-emerald-900">
                              {propertiesTotals?.total_magdalena_atlantico ??
                                (propertiesTotals?.magdalena ?? 0) +
                                  (propertiesTotals?.atlantico ?? 0)}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-emerald-900">Extensionistas únicos</td>
                            <td className="px-3 py-2 font-semibold text-emerald-900">
                              {extensionistsUnique}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-emerald-900">
                        Visitas por departamento
                      </p>
                      <p className="text-xs text-emerald-500">
                        Totales de visitas 1, 2 y 3 por departamento
                      </p>
                      {departmentRows.length > 0 ? (
                        <div className="mt-3 overflow-x-auto">
                          <table className="min-w-full divide-y divide-emerald-100 text-sm">
                            <thead className="bg-emerald-50/80">
                              <tr className="text-left text-emerald-600">
                                <th className="px-3 py-2 font-semibold">Departamento</th>
                                <th className="px-3 py-2 font-semibold">Visita 1</th>
                                <th className="px-3 py-2 font-semibold">Visita 2</th>
                                <th className="px-3 py-2 font-semibold">Visita 3</th>
                                <th className="px-3 py-2 font-semibold">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-50">
                              {departmentRows.map((row) => (
                                <tr key={row.state}>
                                  <td className="px-3 py-2 font-semibold text-emerald-900">
                                    {row.state}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                                      {row.survey_1}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                                      {row.survey_2}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                                      {row.survey_3}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className="rounded-full bg-emerald-900 px-2 py-1 text-xs font-semibold text-white">
                                      {row.total}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-emerald-500">
                          Sin registros de departamentos.
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-emerald-900">
                        Ciudades con más visitas
                      </p>
                      <p className="text-xs text-emerald-500">
                        Top ciudades por total de visitas
                      </p>
                      <div className="mt-3">
                        {topCities.length > 0 ? (
                          <CityChart data={topCities} />
                        ) : (
                          <p className="text-sm text-emerald-500">
                            Sin registros de ciudades.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-emerald-900">
                          Resumen por ciudad
                        </p>
                        <p className="text-xs text-emerald-500">
                          Selecciona departamento y ciudad para ver visitas y estados.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 md:flex-row">
                        <label className="text-sm font-semibold text-emerald-700">
                          Departamento
                          <select
                            className="mt-1 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            value={summaryDepartment}
                            onChange={(e) => {
                              const dept = e.target.value as (typeof SUMMARY_DEPARTMENTS)[number];
                              setSummaryDepartment(dept);
                              const nextCity = SUMMARY_CITIES[dept]?.[0] ?? "";
                              setSummaryCity(nextCity);
                            }}
                          >
                            {SUMMARY_DEPARTMENTS.map((dept) => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-sm font-semibold text-emerald-700">
                          Ciudad
                          <select
                            className="mt-1 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            value={selectedSummaryCity}
                            onChange={(e) => {
                              setSummaryCity(e.target.value);
                            }}
                          >
                            {summaryCityOptions.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>

                    {citySummaryLoading ? (
                      <p className="mt-3 text-sm text-emerald-500">
                        Cargando resumen de ciudad…
                      </p>
                    ) : citySummaryError ? (
                      <p className="mt-3 text-sm text-red-600">
                        {citySummaryFetchError?.message ??
                          "No fue posible cargar el resumen de la ciudad."}
                      </p>
                    ) : citySummary ? (
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-3 md:grid-cols-4">
                          <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                            <p className="text-xs uppercase tracking-[0.08em] text-emerald-600">
                              Ciudad seleccionada
                            </p>
                            <p className="text-lg font-semibold text-emerald-900">
                              {selectedSummaryCity || "N/D"}
                            </p>
                            <p className="text-xs text-emerald-500">
                              Departamento: {summaryDepartment}
                            </p>
                          </div>
                          <div className="rounded-lg border border-emerald-100 bg-white p-3 shadow-sm">
                            <p className="text-xs uppercase tracking-[0.08em] text-emerald-600">
                              Predios
                            </p>
                            <p className="text-lg font-semibold text-emerald-900">
                              {citySummary.properties_count ?? 0}
                            </p>
                          </div>
                          <div className="rounded-lg border border-emerald-100 bg-white p-3 shadow-sm">
                            <p className="text-xs uppercase tracking-[0.08em] text-emerald-600">
                              Total visitas
                            </p>
                            <p className="text-lg font-semibold text-emerald-900">
                              {(citySummary.summary?.survey_1?.count ?? 0) +
                                (citySummary.summary?.survey_2?.count ?? 0) +
                                (citySummary.summary?.survey_3?.count ?? 0)}
                            </p>
                          </div>
                          <div className="rounded-lg border border-emerald-100 bg-white p-3 shadow-sm">
                            <p className="text-xs uppercase tracking-[0.08em] text-emerald-600">
                              Última creación
                            </p>
                            <p className="text-sm font-semibold text-emerald-900">
                              {[
                                citySummary.summary?.survey_1?.latest_created_at,
                                citySummary.summary?.survey_2?.latest_created_at,
                                citySummary.summary?.survey_3?.latest_created_at,
                              ]
                                .filter(Boolean)
                                .map((date) => formatDate(date as string))
                                .join(" · ") || "N/D"}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-lg border border-emerald-100 bg-white p-3 shadow-sm">
                          <p className="text-sm font-semibold text-emerald-900">
                            Resumen por tipo de visita
                          </p>
                          <div className="mt-3 overflow-x-auto">
                            <table className="min-w-full divide-y divide-emerald-100 text-sm">
                              <thead className="bg-emerald-50/80 text-emerald-600">
                                <tr className="text-left">
                                  <th className="px-3 py-2 font-semibold">Tipo</th>
                                  <th className="px-3 py-2 font-semibold">Cantidad</th>
                                  <th className="px-3 py-2 font-semibold">Última fecha</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-emerald-50">
                                {(["survey_1", "survey_2", "survey_3"] as const).map((key, idx) => {
                                  const label = `Visita ${idx + 1}`;
                                  const summary = citySummary.summary?.[key];
                                  return (
                                    <tr key={key}>
                                      <td className="px-3 py-2 text-emerald-900">{label}</td>
                                      <td className="px-3 py-2 font-semibold text-emerald-900">
                                        {summary?.count ?? 0}
                                      </td>
                                      <td className="px-3 py-2 text-emerald-700">
                                        {summary?.latest_created_at
                                          ? formatDate(summary.latest_created_at)
                                          : "N/D"}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="rounded-lg border border-emerald-100 bg-white p-3 shadow-sm">
                          <p className="text-sm font-semibold text-emerald-900">
                            Estados por tipo
                          </p>
                          <div className="mt-3 overflow-x-auto">
                            <table className="min-w-full divide-y divide-emerald-100 text-sm">
                              <thead className="bg-emerald-50/80 text-emerald-600">
                                <tr className="text-left">
                                  <th className="px-3 py-2 font-semibold">Tipo</th>
                                  <th className="px-3 py-2 font-semibold">Pending</th>
                                  <th className="px-3 py-2 font-semibold">Accepted</th>
                                  <th className="px-3 py-2 font-semibold">Rejected</th>
                                </tr>
                              </thead>
                                <tbody className="divide-y divide-emerald-50">
                                  {(["survey_1", "survey_2", "survey_3"] as const).map((key, idx) => {
                                    const label = `Visita ${idx + 1}`;
                                    const stateCountsRaw = citySummary.states_summary?.[key];
                                    const stateCounts = Array.isArray(stateCountsRaw)
                                      ? stateCountsRaw.reduce<Record<string, number>>(
                                          (acc, item: any) => {
                                            if (item?.value) {
                                              acc[item.value] = item.count ?? 0;
                                            }
                                            return acc;
                                          },
                                          {},
                                        )
                                      : (stateCountsRaw as Record<string, number>) ?? {};
                                    return (
                                      <tr key={key}>
                                        <td className="px-3 py-2 text-emerald-900">{label}</td>
                                      {["pending", "accepted", "rejected"].map((state) => (
                                        <td key={state} className="px-3 py-2">
                                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                                            {stateCounts[state] ?? 0}
                                          </span>
                                        </td>
                                      ))}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="rounded-lg border border-emerald-100 bg-white p-3 shadow-sm">
                          <p className="text-sm font-semibold text-emerald-900">
                            Predios en la ciudad
                          </p>
                          <p className="text-xs text-emerald-500">
                            Conteos por predio y tipo de visita.
                          </p>
                          <div className="mt-3 overflow-x-auto">
                            <table className="min-w-full divide-y divide-emerald-100 text-sm">
                              <thead className="bg-emerald-50/80 text-emerald-600">
                                <tr className="text-left">
                                  <th className="px-3 py-2 font-semibold">Predio</th>
                                  <th className="px-3 py-2 font-semibold">Visita 1</th>
                                  <th className="px-3 py-2 font-semibold">Visita 2</th>
                                  <th className="px-3 py-2 font-semibold">Visita 3</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-emerald-50">
                                {citySummary.properties?.map((prop) => (
                                  <tr key={`${prop.property?.id ?? prop.property?.name ?? Math.random()}`}>
                                    <td className="px-3 py-2">
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-emerald-900">
                                          {prop.property?.name ?? "Predio sin nombre"}
                                        </span>
                                        <span className="text-xs text-emerald-500">
                                          {prop.property?.city ?? "Ciudad N/D"} ·{" "}
                                          {prop.property?.state ?? "Depto N/D"}
                                        </span>
                                      </div>
                                    </td>
                                    {(["survey_1", "survey_2", "survey_3"] as const).map((key, idx) => {
                                      const bucket = (prop as any)[key] as SummarySurveyBucket | undefined;
                                      return (
                                        <td key={key} className="px-3 py-2">
                                          <div className="space-y-1 rounded-lg border border-emerald-100 bg-emerald-50/70 p-2">
                                            <p className="text-xs font-semibold text-emerald-900">
                                              Visita {idx + 1}: {bucket?.count ?? 0}
                                            </p>
                                            {bucket?.latest_created_at ? (
                                              <p className="text-[11px] text-emerald-700">
                                                Última: {formatDate(bucket.latest_created_at)}
                                              </p>
                                            ) : null}
                                            {bucket?.states ? (
                                              <div className="flex flex-wrap gap-1 text-[11px] text-emerald-800">
                                                {Object.entries(bucket.states).map(([state, count]) => (
                                                  <span
                                                    key={state}
                                                    className="rounded-full bg-white px-2 py-1 font-semibold"
                                                  >
                                                    {state}: {count}
                                                  </span>
                                                ))}
                                              </div>
                                            ) : null}
                                          </div>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-emerald-500">
                        Selecciona una ciudad para ver el resumen.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-emerald-500">
                  No hay datos estadísticos disponibles.
                </p>
              )}
            </section>
          ) : activeView === "reports" ? (
            <section className={SECTION_CLASS}>
              <SectionHeader
                icon={<FiUsers aria-hidden />}
                title="Reporte de extensionista"
                description="Resumen de visitas P/A/R por extensionista."
              />
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-xs font-semibold text-emerald-800">
                <span className="rounded-full bg-amber-100 px-2 py-1">P = Pendiente</span>
                <span className="rounded-full bg-emerald-100 px-2 py-1">A = Aceptada</span>
                <span className="rounded-full bg-red-100 px-2 py-1">R = Rechazada</span>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="grid flex-1 gap-3 md:grid-cols-2">
                  <label className="text-sm font-semibold text-emerald-700">
                    Ciudad (reporte)
                    <select
                      className="mt-1 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      value={reportCityFilter ?? ""}
                      onChange={(e) => {
                        setReportCityFilter(e.target.value || undefined);
                        setReportPage(1);
                      }}
                    >
                      <option value="">Todas</option>
                      {availableCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-emerald-700">
                    Zona (reporte)
                    <select
                      className="mt-1 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      value={reportZoneFilter ?? ""}
                      onChange={(e) => {
                        setReportZoneFilter(e.target.value || undefined);
                        setReportPage(1);
                      }}
                    >
                      <option value="">Todas</option>
                      {availableZones.map((zone) => (
                        <option key={zone} value={zone}>
                          {zone}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex flex-1 flex-col gap-2 md:max-w-sm">
                  <label className="text-sm font-semibold text-emerald-700">
                    Buscar por nombre
                    <input
                      className="mt-1 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      placeholder="Nombre del extensionista"
                      value={reportSearch}
                      onChange={(e) => {
                        setReportSearch(e.target.value);
                        setReportPage(1);
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-600">
                <button
                  type="button"
                  className="rounded-md border border-emerald-200 px-3 py-1 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900"
                  onClick={() => {
                    setReportCityFilter(undefined);
                    setReportZoneFilter(undefined);
                    setReportSearch("");
                    setReportPage(1);
                  }}
                >
                  Limpiar filtros de reporte
                </button>
                <span>
                  Mostrando {filteredReportExtensionists.length} de {extensionists.length} extensionistas
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-emerald-600">
                    Extensionistas
                  </p>
                  <p className="text-2xl font-semibold text-emerald-900">
                    {filteredReportExtensionists.length}
                  </p>
                </div>
                {(["survey_1", "survey_2", "survey_3"] as const).map((key, idx) => {
                  const bucket = visitTotalsByType[key];
                  const total =
                    (bucket?.pending ?? 0) +
                    (bucket?.accepted ?? 0) +
                    (bucket?.rejected ?? 0);
                  return (
                    <div
                      key={key}
                      className="rounded-lg border border-emerald-100 bg-white p-3 shadow-sm"
                    >
                      <p className="text-xs uppercase tracking-[0.08em] text-emerald-600">
                        Visita {idx + 1}
                      </p>
                      <p className="text-lg font-semibold text-emerald-900">{total}</p>
                      <div className="mt-2 flex flex-wrap gap-1 text-xs">
                        <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-800">
                          P: {bucket?.pending ?? 0}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-800">
                          A: {bucket?.accepted ?? 0}
                        </span>
                        <span className="rounded-full bg-red-100 px-2 py-1 font-semibold text-red-700">
                          R: {bucket?.rejected ?? 0}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredReportExtensionists.length > 0 ? (
                <>
                  <div className="overflow-hidden rounded-xl border border-emerald-100 shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-emerald-100 text-sm">
                        <thead className="bg-emerald-50/80">
                          <tr className="text-left text-emerald-500">
                            <th className="px-4 pb-3 pt-2 font-medium">Nombre</th>
                            <th className="px-4 pb-3 pt-2 font-medium">Correo</th>
                            <th className="px-4 pb-3 pt-2 font-medium">Ciudad</th>
                            <th className="px-4 pb-3 pt-2 font-medium">Zona</th>
                            <th className="px-4 pb-3 pt-2 font-medium">Visita 1</th>
                            <th className="px-4 pb-3 pt-2 font-medium">Visita 2</th>
                            <th className="px-4 pb-3 pt-2 font-medium">Visita 3</th>
                            <th className="px-4 pb-3 pt-2 font-medium">Registrado</th>
                            <th className="px-4 pb-3 pt-2 font-medium"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-100">
                          {paginatedReportExtensionists.map((ext) => {
                            const registeredAt = ext.created_at
                              ? new Date(ext.created_at).toLocaleDateString()
                              : "N/D";
                            return (
                              <tr key={ext.id}>
                                <td className="px-4 py-3 font-semibold text-emerald-900">
                                  {ext.name}
                                </td>
                                <td className="px-4 py-3 text-emerald-600">
                                  {ext.email ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-emerald-600">
                                  {ext.city ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-emerald-600">
                                  {ext.zone ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-emerald-700">
                                  {renderVisitStates(ext, "survey_1")}
                                </td>
                                <td className="px-4 py-3 text-emerald-700">
                                  {renderVisitStates(ext, "survey_2")}
                                </td>
                                <td className="px-4 py-3 text-emerald-700">
                                  {renderVisitStates(ext, "survey_3")}
                                </td>
                                <td className="px-4 py-3 text-emerald-600">
                                  {registeredAt}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900"
                                    type="button"
                                    onClick={() => handleExtensionistSelect(ext)}
                                  >
                                  Ver estadística
                                    <FiChevronRight aria-hidden />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex flex-col gap-3 border-t border-emerald-100 px-4 py-3 text-sm text-emerald-600 md:flex-row md:items-center md:justify-between">
                      <span>
                        Mostrando{" "}
                        <strong className="text-emerald-900">
                          {(reportCurrentPageSafe - 1) * reportPageSize + 1}
                        </strong>{" "}
                        -{" "}
                        <strong className="text-emerald-900">
                          {Math.min(
                            reportCurrentPageSafe * reportPageSize,
                            filteredReportExtensionists.length,
                          )}
                        </strong>{" "}
                        de{" "}
                        <strong className="text-emerald-900">
                          {filteredReportExtensionists.length}
                        </strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                          type="button"
                          disabled={reportCurrentPageSafe === 1}
                          onClick={() =>
                            setReportPage((prev) => Math.max(1, prev - 1))
                          }
                        >
                          <FiChevronLeft aria-hidden />
                          Anterior
                        </button>
                        <span className="text-xs text-emerald-600">
                          Página {reportCurrentPageSafe} de {reportTotalPages}
                        </span>
                        <button
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                          type="button"
                          disabled={reportCurrentPageSafe === reportTotalPages}
                          onClick={() =>
                            setReportPage((prev) =>
                              Math.min(reportTotalPages, prev + 1),
                            )
                          }
                        >
                          Siguiente
                          <FiChevronRight aria-hidden />
                        </button>
                      </div>
                    </div>
                  </div>
                  {selectedExtensionist ? (
                    <div className="mt-4 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-emerald-900">
                            Propiedades de {selectedExtensionist.name}
                          </p>
                          <p className="text-xs text-emerald-500">
                            Estados P/A/R por visita para el extensionista seleccionado.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {propertiesLoading || propertiesFetching ? (
                            <p className="text-xs text-emerald-600">Cargando propiedades...</p>
                          ) : null}
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900 disabled:opacity-60"
                            disabled={reportExporting || !selectedExtensionist}
                            onClick={async () => {
                              if (!selectedExtensionist || !accessToken) return;
                              setReportExportError(null);
                              setReportExporting(true);
                              try {
                                const blob = await exportExtensionistExcel(
                                  selectedExtensionist.id,
                                  accessToken,
                                  tokenType,
                                );
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = url;
                                link.download = `extensionista_${selectedExtensionist.id}.xlsx`;
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                                window.URL.revokeObjectURL(url);
                              } catch (error: any) {
                                const message =
                                  (error?.response?.data as any)?.message ??
                                  error?.message ??
                                  "No fue posible descargar el Excel.";
                                setReportExportError(message);
                              } finally {
                                setReportExporting(false);
                              }
                            }}
                          >
                            {reportExporting ? "Descargando..." : "Descargar Excel"}
                          </button>
                          {reportExportError ? (
                            <span className="text-xs font-semibold text-red-600">
                              {reportExportError}
                            </span>
                          ) : null}
                        </div>
                      </div>
                        {propertiesError ? (
                          <p className="mt-2 text-sm text-red-600">
                            {propertiesFetchError?.message ?? "No fue posible cargar las propiedades."}
                          </p>
                        ) : properties.length > 0 ? (
                          <div className="mt-3 space-y-3">
                            {properties.map((property) => {
                              const isExpanded = reportExpandedPropertyId === property.id;
                              return (
                              <div
                                key={property.id}
                                className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3"
                              >
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-emerald-900">
                                      {property.name}
                                    </p>
                                    <p className="text-xs text-emerald-600">
                                      {property.city ?? property.municipality ?? "Ciudad N/D"} ·{" "}
                                      {property.state ?? "Depto N/D"}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    {(["survey_1", "survey_2", "survey_3"] as const).map(
                                      (key, idx) => (
                                        <div
                                          key={key}
                                          className="rounded-md bg-white px-3 py-2 text-[11px] shadow-sm ring-1 ring-emerald-100"
                                        >
                                          <p className="font-semibold text-emerald-900">
                                            Visita {idx + 1}
                                          </p>
                                          {renderPropertyVisitStates(
                                            property.surveysStateSummary?.[key],
                                          )}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900"
                                    onClick={() =>
                                      setReportExpandedPropertyId(
                                        isExpanded ? null : property.id,
                                      )
                                    }
                                  >
                                    {isExpanded ? "Ocultar detalle" : "Ver detalles"}
                                    <FiChevronRight
                                      className={isExpanded ? "rotate-90 transition" : "transition"}
                                      aria-hidden
                                    />
                                  </button>
                                </div>
                                {isExpanded ? (
                                  <div className="mt-3 grid gap-2 rounded-lg border border-emerald-100 bg-white p-3 text-sm text-emerald-800 md:grid-cols-2">
                                    <p>
                                      <span className="font-semibold">Línea primaria:</span>{" "}
                                      {(property as any).primaryLine ?? (property as any).linea_productive_primary ?? "N/D"}
                                    </p>
                                    <p>
                                      <span className="font-semibold">Línea secundaria:</span>{" "}
                                      {(property as any).secondaryLine ??
                                        (property as any).linea_productive_secondary ??
                                        "N/D"}
                                    </p>
                                    <p>
                                      <span className="font-semibold">Área en producción:</span>{" "}
                                      {(property as any).areaInProduction ??
                                        (property as any).area_in_production ??
                                        "N/D"}
                                    </p>
                                    <p>
                                      <span className="font-semibold">Coordenadas:</span>{" "}
                                      {(property as any).latitude ?? "N/D"},{" "}
                                      {(property as any).longitude ?? "N/D"}
                                    </p>
                                    <p>
                                      <span className="font-semibold">ASNM:</span>{" "}
                                      {(property as any).asnm ?? "N/D"}
                                    </p>
                                    <p>
                                      <span className="font-semibold">Creada:</span>{" "}
                                      {(property as any).createdAt
                                        ? new Date((property as any).createdAt).toLocaleDateString()
                                        : "N/D"}
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-emerald-500">
                          Este extensionista no tiene propiedades asociadas.
                        </p>
                      )}
                    </div>
                  ) : null}
                </>
              ) : (
                renderListState({
                  isLoading: extensionistsLoading,
                  isFetching: extensionistsFetching,
                  isError: extensionistsError,
                  errorMessage: extensionistsFetchError?.message,
                  emptyLabel: "No hay extensionistas para mostrar.",
                })
              )}
            </section>
          ) : (
            <>
              <section className={SECTION_CLASS}>
                <SectionHeader
                  icon={<FiMapPin aria-hidden />}
                  title="1. Busca extensionistas"
                  description="Filtra por nombre y correo para listar los registrados."
                />

                <form
                  className="grid gap-3 md:grid-cols-3"
                  onSubmit={handleFilterSubmit}
                >
                  <input
                    className="rounded-md border border-emerald-200 px-4 py-2 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="Nombre"
                    value={nameInput}
                    onChange={(event) => setNameInput(event.target.value)}
                  />
                  <input
                    className="rounded-md border border-emerald-200 px-4 py-2 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="Correo"
                    value={emailInput}
                    onChange={(event) => setEmailInput(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      className="flex flex-1 items-center justify-center gap-2 rounded-md bg-emerald-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                      type="submit"
                      disabled={!accessToken}
                    >
                      <FiSearch aria-hidden />
                      Buscar
                    </button>
                    <button
                      className="flex items-center rounded-md border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900"
                      type="button"
                      onClick={() => {
                        setNameInput("");
                        setEmailInput("");
                        setAppliedFilters({});
                        setSelectedExtensionist(null);
                        setSelectedProperty(null);
                        setSelectedVisit(null);
                        setVisitDecision(null);
                        setCityFilter(undefined);
                        setZoneFilter(undefined);
                        setShowClassificationDetail(false);
                        setEditableVisit(null);
                        setEditableProducer(null);
                        setEditableProperty(null);
                        setApprovalProfile("");
                        setDecisionReason("");
                        setDecisionError(null);
                        setUpdateMessage(null);
                        setUpdateError(null);
                        setUpdateFiles({});
                        setCurrentPage(1);
                        refetchExtensionists();
                      }}
                    >
                      Limpiar
                    </button>
                  </div>
                </form>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="text-sm font-semibold text-emerald-700">
                    Ciudad (selecciona para filtrar)
                    <select
                      className="mt-2 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      value={cityFilter ?? ""}
                      onChange={(e) =>
                        applyFiltersAndReset({
                          cityOverride: e.target.value || undefined,
                        })
                      }
                    >
                      <option value="">Todas</option>
                      {availableCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm font-semibold text-emerald-700">
                    Zona (selecciona para filtrar)
                    <select
                      className="mt-2 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      value={zoneFilter ?? ""}
                      onChange={(e) =>
                        applyFiltersAndReset({
                          zoneOverride: e.target.value || undefined,
                        })
                      }
                    >
                      <option value="">Todas</option>
                      {availableZones.map((zone) => (
                        <option key={zone} value={zone}>
                          {zone}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {extensionists.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-emerald-100 shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-emerald-100 text-sm">
                        <thead className="bg-emerald-50/80">
                          <tr className="text-left text-emerald-500">
                            <th className="px-4 pb-3 pt-2 font-medium">Nombre</th>
                            <th className="px-4 pb-3 pt-2 font-medium">Correo</th>
                            <th className="px-4 pb-3 pt-2 font-medium">Teléfono</th>
                            <th className="px-4 pb-3 pt-2 font-medium">Ciudad</th>
                            <th className="px-4 pb-3 pt-2 font-medium">Visita 1</th>
                            <th className="px-4 pb-3 pt-2 font-medium">Visita 2</th>
                            <th className="px-4 pb-3 pt-2 font-medium">Visita 3</th>
                            <th className="px-4 pb-3 pt-2 font-medium">Registrado</th>
                            <th className="px-4 pb-3 pt-2 font-medium"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-100">
                          {paginatedExtensionists.map((extensionist) => {
                            const isActive =
                              extensionist.id === selectedExtensionist?.id;
                            const registeredAt = extensionist.created_at
                              ? new Date(extensionist.created_at).toLocaleDateString()
                              : "N/D";
                            return (
                              <tr
                                key={extensionist.id}
                                className={isActive ? "bg-emerald-50" : undefined}
                              >
                                <td className="px-4 py-3 font-semibold text-emerald-900">
                                  {extensionist.name}
                                </td>
                                <td className="px-4 py-3 text-emerald-600">
                                  {extensionist.email ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-emerald-600">
                                  {extensionist.phone}
                                </td>
                                <td className="px-4 py-3 text-emerald-600">
                                  {extensionist.city ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-emerald-700">
                                  {renderVisitStates(extensionist, "survey_1")}
                                </td>
                                <td className="px-4 py-3 text-emerald-700">
                                  {renderVisitStates(extensionist, "survey_2")}
                                </td>
                                <td className="px-4 py-3 text-emerald-700">
                                  {renderVisitStates(extensionist, "survey_3")}
                                </td>
                                <td className="px-4 py-3 text-emerald-600">
                                  {registeredAt}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    className={`inline-flex items-center gap-1 rounded-md border px-3 py-1 text-xs font-semibold transition ${
                                      isActive
                                        ? "border-emerald-900 bg-emerald-900 text-white"
                                        : "border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:text-emerald-900"
                                    }`}
                                    type="button"
                                    onClick={() =>
                                      handleExtensionistSelect(extensionist)
                                    }
                                  >
                                    Seleccionar
                                    <FiChevronRight aria-hidden />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-emerald-100 px-4 py-3 text-sm text-emerald-600 md:flex-row md:items-center md:justify-between">
                      <span>
                        Mostrando{" "}
                        <strong className="text-emerald-900">
                          {(currentPageSafe - 1) * pageSize + 1}
                        </strong>{" "}
                        -{" "}
                        <strong className="text-emerald-900">
                          {Math.min(currentPageSafe * pageSize, filteredExtensionists.length)}
                        </strong>{" "}
                        de{" "}
                        <strong className="text-emerald-900">
                          {filteredExtensionists.length}
                        </strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                          type="button"
                          disabled={currentPageSafe === 1}
                          onClick={() => goToPage(currentPageSafe - 1)}
                        >
                          <FiChevronLeft aria-hidden />
                          Anterior
                        </button>
                        <span className="text-xs text-emerald-600">
                          Página {currentPageSafe} de {totalPages}
                        </span>
                        <button
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                          type="button"
                          disabled={currentPageSafe === totalPages}
                          onClick={() => goToPage(currentPageSafe + 1)}
                        >
                          Siguiente
                          <FiChevronRight aria-hidden />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  renderListState({
                    isLoading: extensionistsLoading,
                    isFetching: extensionistsFetching,
                    isError: extensionistsError,
                    errorMessage: extensionistsFetchError?.message,
                    emptyLabel:
                      "Usa los filtros para encontrar extensionistas registrados.",
                  })
                )}
              </section>

              <section className={SECTION_CLASS}>
                <SectionHeader
                  icon={<FiHome aria-hidden />}
                  title="Propiedades del extensionista"
                  description="Selecciona un extensionista y explora sus predios registrados."
                />

                {!selectedExtensionist ? (
                  <p className="text-sm text-emerald-500">
                    Selecciona un extensionista para ver sus propiedades.
                  </p>
                ) : properties.length > 0 ? (
                  <>
                    {propertiesSummary ? (
                      <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                        <p className="text-sm font-semibold text-emerald-900">
                          Resumen de visitas en propiedades
                        </p>
                        <p className="text-xs text-emerald-500">
                          Pendientes (P), aceptadas (A) y rechazadas (R) por tipo de visita.
                        </p>
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          {(["survey_1", "survey_2", "survey_3"] as const).map(
                            (key, idx) => {
                              const bucket = propertiesSummary?.[key];
                              return (
                                <div
                                  key={key}
                                  className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3"
                                >
                                  <p className="text-xs uppercase tracking-[0.1em] text-emerald-600">
                                    Visita {idx + 1}
                                  </p>
                                  <div className="mt-2 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-emerald-900">
                                      Total:{" "}
                                      {(bucket?.pending ?? 0) +
                                        (bucket?.accepted ?? 0) +
                                        (bucket?.rejected ?? 0)}
                                    </span>
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-1 text-xs">
                                    <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-800">
                                      P: {bucket?.pending ?? 0}
                                    </span>
                                    <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-800">
                                      A: {bucket?.accepted ?? 0}
                                    </span>
                                    <span className="rounded-full bg-red-100 px-2 py-1 font-semibold text-red-700">
                                      R: {bucket?.rejected ?? 0}
                                    </span>
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <input
                        className="w-full rounded-md border border-emerald-200 px-3 py-2 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 md:max-w-sm"
                        placeholder="Buscar propiedad por nombre"
                        value={propertySearch}
                        onChange={(e) => {
                          setPropertySearch(e.target.value);
                          setPropertyPage(1);
                        }}
                      />
                      <div className="flex items-center gap-2 text-xs text-emerald-600">
                        <span>
                          Propiedades:{" "}
                          <strong className="text-emerald-900">
                            {filteredProperties.length}
                          </strong>
                        </span>
                        <span className="hidden md:inline-block">·</span>
                        <span>
                          Página {currentPropertyPageSafe} de {propertiesTotalPages}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {paginatedProperties.map((property) => {
                      const isExpanded = expandedPropertyId === property.id;
                      return (
                        <div
                          className="rounded-xl border border-emerald-100 bg-white shadow-sm"
                          key={property.id}
                        >
                          <div
                            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                            onClick={() =>
                              setExpandedPropertyId(
                                isExpanded ? null : property.id,
                              )
                            }
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setExpandedPropertyId(
                                  isExpanded ? null : property.id,
                                );
                              }
                            }}
                          >
                            <div>
                              <p className="text-base font-semibold text-emerald-900">
                                {property.name}
                              </p>
                              <p className="text-sm text-emerald-500">
                                {property.city ?? property.municipality ?? "Ciudad N/D"} ·{" "}
                                {property.state ?? "Estado N/D"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col gap-1 text-right">
                                <p className="text-[11px] font-semibold text-emerald-700">
                                  Visitas
                                </p>
                                <div className="flex gap-1">
                                  {(["survey_1", "survey_2", "survey_3"] as const).map(
                                    (key, idx) => (
                                      <div
                                        key={key}
                                        className="rounded-md bg-white px-2 py-1 text-[11px] shadow-sm ring-1 ring-emerald-100"
                                      >
                                        <p className="font-semibold text-emerald-900">
                                          V{idx + 1}
                                        </p>
                                        {renderPropertyVisitStates(
                                          property.surveysStateSummary?.[key],
                                        )}
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                              <button
                              className="rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                  setSelectedProperty(property);
                                  setSelectedVisit(1);
                                  setVisitDecision(null);
                                  setShowClassificationDetail(false);
                                  setEditableVisit(null);
                                  setEditableProducer(null);
                                  setEditableProperty(null);
                                  setApprovalProfile("");
                                  setDecisionReason("");
                                  setDecisionError(null);
                                  setUpdateMessage(null);
                                  setUpdateError(null);
                                  setUpdateFiles({});
                                  setExpandedPropertyId(property.id);
                                }}
                              >
                                Encuestas
                              </button>
                              <span
                                className={`rounded-full border border-emerald-200 p-2 text-emerald-600 transition ${
                                  isExpanded ? "bg-emerald-50 rotate-90" : ""
                                }`}
                              >
                                <FiChevronRight aria-hidden />
                              </span>
                            </div>
                          </div>

                          {isExpanded ? (
                            <div className="grid gap-3 border-t border-emerald-100 px-4 py-3 md:grid-cols-3">
                              <div className="rounded-lg bg-emerald-50 p-3">
                                <p className="text-xs uppercase tracking-[0.1em] text-emerald-500">
                                  Línea primaria
                                </p>
                                <p className="text-sm font-semibold text-emerald-900">
                                  {property.primaryLine ?? "N/D"}
                                </p>
                                {property.secondaryLine ? (
                                  <p className="text-xs text-emerald-500">
                                    Secundaria: {property.secondaryLine}
                                  </p>
                                ) : null}
                              </div>
                              <div className="rounded-lg bg-emerald-50 p-3">
                                <p className="text-xs uppercase tracking-[0.1em] text-emerald-500">
                                  Vereda
                                </p>
                                <p className="text-sm font-semibold text-emerald-900">
                                  {property.village ?? "N/D"}
                                </p>
                              </div>
                              <div className="rounded-lg bg-emerald-50 p-3">
                                <p className="text-xs uppercase tracking-[0.1em] text-emerald-500">
                                  Área en producción
                                </p>
                                <p className="text-sm font-semibold text-emerald-900">
                                  {property.areaInProduction ?? "N/D"} ha
                                </p>
                              </div>
                              <div className="rounded-lg bg-emerald-50 p-3">
                                <p className="text-xs uppercase tracking-[0.1em] text-emerald-500">
                                  Coordenadas
                                </p>
                                <p className="text-sm font-semibold text-emerald-900">
                                  {(property as any).latitude ?? "N/D"},{" "}
                                  {(property as any).longitude ?? "N/D"}
                                </p>
                              </div>
                              <div className="rounded-lg bg-emerald-50 p-3">
                                <p className="text-xs uppercase tracking-[0.1em] text-emerald-500">
                                  Creado
                                </p>
                                <p className="text-sm font-semibold text-emerald-900">
                                  {property.createdAt
                                    ? new Date(property.createdAt).toLocaleDateString()
                                    : "N/D"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  className="inline-flex items-center gap-2 rounded-md border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900"
                                  type="button"
                                  onClick={() => {
                                    setSelectedProperty(property);
                                    setSelectedVisit(1);
                                  setVisitDecision(null);
                                  setShowClassificationDetail(false);
                                  setEditableVisit(null);
                                  setEditableProducer(null);
                                  setEditableProperty(null);
                                  setApprovalProfile("");
                                  setDecisionReason("");
                                  setDecisionError(null);
                                  setUpdateMessage(null);
                                  setUpdateError(null);
                                  setUpdateFiles({});
                                }}
                              >
                                Ver encuestas
                              </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                    <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <span className="text-xs text-emerald-600">
                        Mostrando {paginatedProperties.length} de {filteredProperties.length} propiedades
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                          type="button"
                          disabled={currentPropertyPageSafe === 1}
                          onClick={() =>
                            setPropertyPage((prev) => Math.max(1, prev - 1))
                          }
                        >
                          <FiChevronLeft aria-hidden />
                          Anterior
                        </button>
                        <span className="text-xs text-emerald-600">
                          Página {currentPropertyPageSafe} de {propertiesTotalPages}
                        </span>
                        <button
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                          type="button"
                          disabled={currentPropertyPageSafe === propertiesTotalPages}
                          onClick={() =>
                            setPropertyPage((prev) =>
                              Math.min(propertiesTotalPages, prev + 1),
                            )
                          }
                        >
                          Siguiente
                          <FiChevronRight aria-hidden />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  renderListState({
                    isLoading: propertiesLoading,
                    isFetching: propertiesFetching,
                    isError: propertiesError,
                    errorMessage: propertiesFetchError?.message,
                    emptyLabel:
                      "Selecciona un extensionista para mostrar sus propiedades.",
                  })
                )}
              </section>

              <section className={SECTION_CLASS}>
                <SectionHeader
                  icon={<FiUsers aria-hidden />}
                  title="Encuestas de la propiedad"
                  description="Selecciona una propiedad para habilitar las visitas."
                />

                {!selectedProperty ? (
                  <p className="text-sm text-emerald-500">
                    Selecciona una propiedad para ver las visitas disponibles.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">
                          Propiedad seleccionada
                        </p>
                        <p className="text-lg font-semibold text-emerald-900">
                          {selectedProperty.name}
                        </p>
                        <p className="text-sm text-emerald-600">
                          {selectedProperty.city ?? selectedProperty.municipality ?? "Ciudad N/D"} ·{" "}
                          {(selectedProperty as any).state ?? "Estado N/D"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3].map((num) => {
                          const isActive = selectedVisit === num;
                          return (
                            <button
                              key={num}
                              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                                isActive
                                  ? "border-emerald-900 bg-emerald-900 text-white"
                                  : "border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:text-emerald-900"
                              }`}
                              type="button"
                              onClick={() => {
                                setSelectedVisit(num);
                                setVisitDecision(null);
                                setShowClassificationDetail(false);
                                setEditableVisit(null);
                                setEditableProducer(null);
                                setEditableProperty(null);
                                setApprovalProfile("");
                                setUpdateMessage(null);
                                setUpdateError(null);
                                setUpdateFiles({});
                              }}
                            >
                              Visita {num}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {!selectedVisit ? (
                      <p className="text-sm text-emerald-500">
                        Selecciona una visita para cargar la información.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                            onClick={handleBasicUpdate}
                            disabled={updatingVisit || !visitDetail?.id}
                          >
                            <FiFileText aria-hidden />
                            {updatingVisit ? "Guardando..." : "Guardar cambios"}
                          </button>
                          <button
                            className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                            onClick={() => handleDecisionSubmit("accepted")}
                            disabled={!approvalProfile.trim() || decisionLoading || !visitDetail?.id}
                            title={
                              approvalProfile.trim()
                                ? "Marcar como aceptado"
                                : "Agrega el perfil antes de aceptar"
                            }
                          >
                            <FiCheck aria-hidden />
                            Aceptar
                          </button>
                          <button
                            className="inline-flex items-center gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:border-red-200"
                            type="button"
                            onClick={() => handleDecisionSubmit("rejected")}
                            disabled={!approvalProfile.trim() || decisionLoading || !visitDetail?.id}
                          >
                            <FiX aria-hidden />
                            Rechazar
                          </button>
                          {visitDetail?.file_pdf ? (
                            <a
                              className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300"
                              href={visitDetail.file_pdf as string}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <FiFileText aria-hidden />
                              Ver PDF
                              <FiExternalLink className="hidden text-emerald-500 sm:inline" aria-hidden />
                            </a>
                          ) : (
                            <button
                              className="inline-flex items-center gap-2 rounded-md border border-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-500 opacity-70"
                              type="button"
                              disabled
                            >
                              <FiFileText aria-hidden />
                              PDF no disponible
                            </button>
                          )}
                          {visitDecision ? (
                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                                visitDecision === "accepted"
                                  ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-700"
                            }`}
                          >
                            {visitDecision === "accepted"
                              ? "Marcado como aceptado (solo UI)"
                              : "Marcado como rechazado (solo UI)"}
                          </span>
                        ) : null}
                          {updateMessage ? (
                            <span className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                              {updateMessage}
                            </span>
                          ) : null}
                          {updateError ? (
                            <span className="text-sm font-semibold text-red-600">
                              {updateError}
                            </span>
                          ) : null}
                          <div className="w-full max-w-xs">
                            <FieldInput
                              label="Perfil (requerido para aceptar)"
                              value={approvalProfile}
                              onChange={(v) => setApprovalProfile(v)}
                              placeholder="Ingresa el perfil antes de aceptar"
                              highlight
                            />
                          </div>
                          <div className="w-full max-w-md">
                            <FieldInput
                              label="Motivo (opcional)"
                              value={decisionReason}
                              onChange={(v) => setDecisionReason(v)}
                              placeholder="Ej: Documentos verificados"
                              type="textarea"
                            />
                          </div>
                          {decisionError ? (
                            <p className="text-sm font-semibold text-red-600">{decisionError}</p>
                          ) : null}
                          {decisionLoading ? (
                            <p className="text-xs text-emerald-600">Actualizando estado…</p>
                          ) : null}
                        </div>

                        {surveyVisitLoading || surveyVisitFetching ? (
                          <p className="text-sm text-emerald-500">
                            Consultando visita {selectedVisit}...
                          </p>
                        ) : surveyVisitError ? (
                          <div className="flex flex-col gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                            <span>
                              No pudimos cargar la visita.{" "}
                              {surveyVisitFetchError?.message ??
                                "Revisa la conexión o la sesión e intenta de nuevo."}
                            </span>
                            <button
                              className="w-fit rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:border-red-300"
                              type="button"
                              onClick={() => refetchSurveyVisit()}
                            >
                              Reintentar
                            </button>
                          </div>
                        ) : !visitDetail ? (
                          <p className="text-sm text-emerald-500">
                            No hay información registrada para la visita {selectedVisit}.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            <div className="rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-800 p-5 text-white shadow-sm">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                                    Formato institucional
                                  </p>
                                  <h3 className="text-2xl font-semibold">
                                    FORMATO ACOMPAÑAMIENTO DEL EXTENSIONISTA
                                  </h3>
                                  <p className="text-sm text-emerald-200">
                                    Resumen de la visita y datos consolidados.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                  <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white ring-1 ring-white/20">
                                    Visita No. {selectedVisit}
                                  </span>
                                  <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white ring-1 ring-white/20">
                                    Coordenadas: {(editableProperty as any)?.latitude ?? "N/D"},{" "}
                                    {(editableProperty as any)?.longitude ?? "N/D"}
                                  </span>
                                  <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white ring-1 ring-white/20">
                                    Registro:{" "}
                                    {editableVisit?.date_acompanamiento
                                      ? `${formatDate(editableVisit.date_acompanamiento as string)} ${editableVisit.hour_acompanamiento ?? ""}`.trim()
                                      : "Sin fecha"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                              <div className="grid gap-3 lg:grid-cols-2">
                                <FieldInput
                                  label="Objetivo del Acompañamiento"
                                  value={editableVisit?.objetive_accompaniment as string}
                                  onChange={(v) => updateVisitField("objetive_accompaniment", v)}
                                  placeholder="Redacte y escriba el objetivo acorde a lo definido por la EPSEA"
                                  highlight
                                />
                                <FieldInput
                                  label="Creada"
                                  value={
                                    formatDateWithTime(
                                      (editableVisit?.date_acompanamiento as string) ??
                                        ((visitDetail as any)?.created_at as string | undefined),
                                      (editableVisit?.hour_acompanamiento as string) ??
                                        (visitDetail as any)?.hour_acompanamiento,
                                    ) ?? ""
                                  }
                                  readOnly
                                  highlight
                                />
                              </div>
                            </div>

                            <SectionCard number="1." title="Identificación Del Usuario Productor">
                              <div className="grid gap-2 lg:grid-cols-3">
                                <FieldInput
                                  label="Nombre Completo Usuario Productor"
                                  value={(editableProducer as any)?.name}
                                  onChange={(v) => updateProducerField("name", v)}
                                  placeholder="Ej: Juan Carlos Pérez Gómez"
                                />
                                <FieldInput
                                  label="Tipo de Documento"
                                  type="select"
                                  options={["CC", "TI", "CE", "NIT"]}
                                  value={(editableProducer as any)?.type_id}
                                  onChange={(v) => updateProducerField("type_id", v)}
                                />
                                <FieldInput
                                  label="Número de Identificacion"
                                  value={(editableProducer as any)?.identification}
                                  onChange={(v) => updateProducerField("identification", v)}
                                  placeholder="Ej: 1234567890"
                                />
                                <FieldInput
                                  label="Número Telefonico"
                                  value={(editableProducer as any)?.number_phone}
                                  onChange={(v) => updateProducerField("number_phone", v)}
                                  placeholder="Ej: 3001234567"
                                />
                              </div>
                            </SectionCard>

                            <SectionCard number="2." title="Identificación del Predio">
                              <div className="grid gap-2 lg:grid-cols-3">
                                <FieldInput
                                  label="Nombre del Predio"
                                  value={(editableProperty as any)?.name}
                                  onChange={(v) => updatePropertyField("name", v)}
                                  placeholder="Ej: Finca La Esperanza"
                                />
                                <FieldInput
                                  label="Coordenadas Geográficas"
                                  value={[
                                    (editableProperty as any)?.latitude ?? "",
                                    (editableProperty as any)?.longitude ?? "",
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                  onChange={(v) => {
                                    const [lat, lon] = v.split(",").map((part) => part.trim());
                                    setEditableProperty((prev) =>
                                      prev
                                        ? { ...prev, latitude: lat ?? "", longitude: lon ?? "" }
                                        : prev,
                                    );
                                  }}
                                  placeholder="Ej: 10.188612074, -74.065231283"
                                />
                                <FieldInput
                                  label="ASNM"
                                  value={(editableProperty as any)?.asnm}
                                  onChange={(v) => updatePropertyField("asnm", v)}
                                  placeholder="Ej: 0"
                                />
                                <FieldInput
                                  label="Departamento"
                                  type="select"
                                  options={[...DEPARTMENTS] as string[]}
                                  value={(editableProperty as any)?.state}
                                  onChange={(v) => updatePropertyField("state", v)}
                                />
                                <FieldInput
                                  label="Municipio"
                                  type="select"
                                  options={availableMunicipalities}
                                  value={(editableProperty as any)?.city ?? (editableProperty as any)?.municipality}
                                  onChange={(v) => {
                                    updatePropertyField("city", v);
                                    updatePropertyField("municipality", v);
                                  }}
                                />
                                <FieldInput
                                  label="Corregimiento/Vereda"
                                  value={(editableProperty as any)?.village}
                                  onChange={(v) => updatePropertyField("village", v)}
                                  placeholder="Ej: Vereda Mock"
                                />
                              </div>
                            </SectionCard>

                            <SectionCard number="3." title="Identificación Del Sistema Productivo">
                              <div className="grid gap-2 lg:grid-cols-2">
                                <FieldInput
                                  label="Linea Productiva Principal"
                                  value={
                                    (editableProperty as any)?.primaryLine ??
                                    (editableProperty as any)?.linea_productive_primary
                                  }
                                  onChange={(v) => {
                                    updatePropertyField("primaryLine", v);
                                    updatePropertyField("linea_productive_primary", v);
                                  }}
                                  placeholder="Ej: Cacao"
                                />
                                <FieldInput
                                  label="Linea Productiva Secundaria"
                                  value={
                                    (editableProperty as any)?.secondaryLine ??
                                    (editableProperty as any)?.linea_productive_secondary
                                  }
                                  onChange={(v) => {
                                    updatePropertyField("secondaryLine", v);
                                    updatePropertyField("linea_productive_secondary", v);
                                  }}
                                  placeholder="Ej: Otra"
                                />
                              </div>
                              <FieldInput
                                label="Área total En Producción"
                                value={
                                  (editableProperty as any)?.areaInProduction ??
                                  (editableProperty as any)?.area_in_production
                                }
                                onChange={(v) => {
                                  updatePropertyField("areaInProduction", v);
                                  updatePropertyField("area_in_production", v);
                                }}
                                placeholder="Ej: 15.50"
                              />
                            </SectionCard>

                            <SectionCard
                              number="4."
                              title="Clasificación Del Usuario (Según Ley 1876 Del 2017)"
                            >
                              <FieldInput
                                label="Nivel de clasificación (último diagnóstico aplicado)"
                                value={classificationTotal ?? "N/D"}
                                readOnly
                              />
                              {classificationEntries.length > 0 ? (
                                <div className="pt-2">
                                  <button
                                    type="button"
                                    className="rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800 transition hover:border-emerald-300 hover:text-emerald-900"
                                    onClick={() => setShowClassificationDetail((prev) => !prev)}
                                  >
                                    {showClassificationDetail ? "Ocultar detalle" : "Ver detalle"}
                                  </button>
                                  {showClassificationDetail ? (
                                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                      {classificationEntries.map(([key, value]) => (
                                        <div
                                          key={key}
                                          className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2"
                                        >
                                          <p className="text-xs uppercase tracking-[0.1em] text-emerald-600">
                                            {prettifyKey(key)}
                                          </p>
                                          <p className="text-sm font-semibold text-emerald-900">
                                            {value ?? "N/D"}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </SectionCard>

                            <SectionCard number="5." title="Enfoque Técnico Productivo">
                              <FieldInput
                                label="Objetivo del Acompañamiento"
                                value={editableVisit?.objetive_accompaniment as string}
                                onChange={(v) => updateVisitField("objetive_accompaniment", v)}
                                type="textarea"
                                placeholder="Redacte y escriba el objetivo acorde a lo definido por la EPSEA"
                                highlight
                              />
                              <FieldInput
                                label="5.1 Diagnóstico visita"
                                value={editableVisit?.initial_diagnosis as string}
                                onChange={(v) => updateVisitField("initial_diagnosis", v)}
                                type="textarea"
                                placeholder="Describa hallazgos y situación encontrada en la finca"
                              />
                              <FieldInput
                                label="5.2 Recomendaciones  y Compromisos"
                                value={editableVisit?.recommendations_commitments as string}
                                onChange={(v) =>
                                  updateVisitField("recommendations_commitments", v)
                                }
                                type="textarea"
                                placeholder="Plantee recomendaciones técnicas relevantes"
                              />
                              {selectedVisit !== 1 ? (
                                <div className="rounded-lg border border-emerald-50 bg-emerald-50/60 p-3">
                                  <p className="text-xs uppercase tracking-[0.08em] text-emerald-600">
                                    5.3 Se Cumplió con las recomendaciones de la visita Anterior
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {["SI", "NO", "No aplica"].map((option) => {
                                      const isActive =
                                        (editableVisit?.compliance_status as string) === option;
                                      return (
                                        <button
                                          key={option}
                                          type="button"
                                          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                                            isActive
                                              ? "bg-emerald-900 text-white"
                                              : "bg-white text-emerald-800 ring-1 ring-emerald-200 hover:ring-emerald-300"
                                          }`}
                                          onClick={() => updateVisitField("compliance_status", option)}
                                        >
                                          {option}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : null}
                              <FieldInput
                                label="5.4 Observaciones visita"
                                value={editableVisit?.observations_visited as string}
                                onChange={(v) => updateVisitField("observations_visited", v)}
                                type="textarea"
                              />
                              <div className="rounded-lg border border-emerald-50 bg-emerald-50/60 p-3">
                                <p className="text-xs uppercase tracking-[0.08em] text-emerald-600">
                                  5.5 Registro Fotográfico visita
                                </p>
                                {photoGallery.length > 0 ? (
                                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    {photoGallery.map((photo) => (
                                      <div
                                        key={photo.label}
                                        className="overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm"
                                      >
                                        <img
                                          src={photo.url}
                                          alt={photo.label}
                                          className="h-44 w-full object-cover"
                                        />
                                        <div className="flex items-center justify-between px-3 py-2">
                                          <p className="text-sm font-semibold text-emerald-900">
                                            {photo.label}
                                          </p>
                                          <a
                                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                                            href={photo.url}
                                            target="_blank"
                                            rel="noreferrer"
                                          >
                                            Ver grande
                                          </a>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="mt-2 grid gap-2 text-sm text-emerald-800 sm:grid-cols-2 lg:grid-cols-4">
                                    {["archivo imagen 1", "archivo imagen 2", "archivo imagen 3", "archivo imagen 4"].map(
                                      (label) => (
                                        <div
                                          key={label}
                                          className="flex h-32 items-center justify-center rounded-md border border-dashed border-emerald-200 bg-white text-emerald-500"
                                        >
                                          {label}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                                <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                  <label className="text-sm font-semibold text-emerald-700">
                                    Subir nueva foto del productor (opcional)
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="mt-1 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                      onChange={(e) =>
                                        handleFileChange("photo_user", e.target.files)
                                      }
                                    />
                                    {updateFiles.photo_user ? (
                                      <span className="text-xs text-emerald-600">
                                        Listo: {updateFiles.photo_user.name}
                                      </span>
                                    ) : null}
                                  </label>
                                  <label className="text-sm font-semibold text-emerald-700">
                                    Subir nueva foto de interacción (opcional)
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="mt-1 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                      onChange={(e) =>
                                        handleFileChange("photo_interaction", e.target.files)
                                      }
                                    />
                                    {updateFiles.photo_interaction ? (
                                      <span className="text-xs text-emerald-600">
                                        Listo: {updateFiles.photo_interaction.name}
                                      </span>
                                    ) : null}
                                  </label>
                                  <label className="text-sm font-semibold text-emerald-700">
                                    Subir panorama (opcional)
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="mt-1 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                      onChange={(e) =>
                                        handleFileChange("photo_panorama", e.target.files)
                                      }
                                    />
                                    {updateFiles.photo_panorama ? (
                                      <span className="text-xs text-emerald-600">
                                        Listo: {updateFiles.photo_panorama.name}
                                      </span>
                                    ) : null}
                                  </label>
                                  <label className="text-sm font-semibold text-emerald-700">
                                    Subir foto adicional (opcional)
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="mt-1 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                      onChange={(e) =>
                                        handleFileChange("phono_extra_1", e.target.files)
                                      }
                                    />
                                    {updateFiles.phono_extra_1 ? (
                                      <span className="text-xs text-emerald-600">
                                        Listo: {updateFiles.phono_extra_1.name}
                                      </span>
                                    ) : null}
                                  </label>
                                  <label className="text-sm font-semibold text-emerald-700">
                                    Subir PDF (opcional)
                                    <input
                                      type="file"
                                      accept="application/pdf"
                                      className="mt-1 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                      onChange={(e) =>
                                        handleFileChange("file_pdf", e.target.files)
                                      }
                                    />
                                    {updateFiles.file_pdf ? (
                                      <span className="text-xs text-emerald-600">
                                        Listo: {updateFiles.file_pdf.name}
                                      </span>
                                    ) : null}
                                  </label>
                                </div>
                              </div>
                            </SectionCard>

                            {focalizationEntries.length > 0 ? (
                              <SectionCard number="5.6" title="Medición y focalización">
                                <div className="grid gap-3 md:grid-cols-2">
                                  {focalizationEntries.map(([key, value]) => (
                                    <div
                                      key={key}
                                      className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3"
                                    >
                                      <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-emerald-900">
                                          {prettifyKey(key)}
                                        </p>
                                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                                          Puntaje: {value?.score ?? "N/D"}
                                        </span>
                                      </div>
                                      <p className="mt-2 text-sm text-emerald-700">
                                        {value?.obervation ?? "Sin observación registrada."}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </SectionCard>
                            ) : null}

                            <SectionCard number="6." title="Datos del Acompañamiento">
                              <div className="grid gap-2 lg:grid-cols-3">
                                <FieldInput
                                  label="Fecha y hora registro Acompañamiento (automática)"
                                  value={
                                    editableVisit?.date_acompanamiento
                                      ? `${formatDate(editableVisit.date_acompanamiento as string)} ${editableVisit.hour_acompanamiento ?? ""}`.trim()
                                      : "Sin fecha"
                                  }
                                  readOnly
                                />
                                <FieldInput
                                  label="Origen registro"
                                  value="app_movil"
                                  readOnly
                                />
                                <FieldInput
                                  label="Fecha de la visita"
                                  value={formatDate(editableVisit?.visit_date as string)}
                                  onChange={(v) => updateVisitField("visit_date", v)}
                                  placeholder="AAAA-MM-DD"
                                />
                                <FieldInput
                                  label="Nombre Persona quien atiende el Acompañamiento"
                                  value={
                                    (editableVisit?.name_acompanamiento as string) ??
                                    (editableVisit?.attended_by as string)
                                  }
                                  onChange={(v) => updateVisitField("name_acompanamiento", v)}
                                  placeholder="Ej: Usuario Productor"
                                />
                                <div className="rounded-lg border border-emerald-50 bg-emerald-50/60 p-3">
                                  <p className="text-xs uppercase tracking-[0.08em] text-emerald-600">
                                    Rol de quien atiende
                                  </p>
                                  <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                                    {[
                                      "Usuario Productor",
                                      "Trabajador UP",
                                      "Persona núcleo familiar",
                                      "Otro",
                                    ].map((role) => {
                                      const isActive =
                                        (editableVisit?.attended_by as string) === role;
                                      return (
                                        <button
                                          key={role}
                                          type="button"
                                          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                                            isActive
                                              ? "bg-emerald-900 text-white"
                                              : "bg-white text-emerald-800 ring-1 ring-emerald-200 hover:ring-emerald-300"
                                          }`}
                                          onClick={() => updateVisitField("attended_by", role)}
                                        >
                                          {role}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {(editableVisit?.attended_by as string) &&
                                  (editableVisit?.attended_by as string) !== "Usuario Productor" ? (
                                    <FieldInput
                                      label="Solo si quien atiende es diferente al productor"
                                      value={editableVisit?.attendee_role as string}
                                      onChange={(v) => updateVisitField("attendee_role", v)}
                                      placeholder="Trabajador UP, Persona Núcleo Familiar, Otro"
                                    />
                                  ) : null}
                                </div>
                                <FieldInput
                                  label="Estado actual"
                                  value={editableVisit?.state as string}
                                  readOnly
                                />
                              </div>
                            </SectionCard>

                            <SectionCard number="7." title="Datos Del Extensionista">
                              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                <FieldInput
                                  label="Nombre del Extensionista"
                                  value={(visitExtensionist as any)?.name}
                                  readOnly
                                />
                                <FieldInput
                                  label="Identificación Del Extensionista"
                                  value={(visitExtensionist as any)?.identification}
                                  readOnly
                                />
                                <FieldInput
                                  label="Fecha firma extensionista"
                                  value={
                                    formatDate(
                                      (visitDetail?.date_hour_end as string) ??
                                        (visitDetail?.date_acompanamiento as string),
                                    ) ?? ""
                                  }
                                  readOnly
                                />
                                <div className="rounded-lg border border-emerald-50 bg-emerald-50/60 p-3">
                                  <p className="text-xs uppercase tracking-[0.08em] text-emerald-600">
                                    Firma extensionista
                                  </p>
                                  {(visitExtensionist as any)?.signing_image_path ? (
                                    <img
                                      src={(visitExtensionist as any)?.signing_image_path}
                                      alt="Firma del extensionista"
                                      className="mt-2 h-20 w-full max-w-xs rounded-md border border-emerald-100 bg-white object-contain p-2"
                                    />
                                  ) : (
                                    <p className="text-sm font-semibold text-emerald-900">
                                      Sin firma adjunta
                                    </p>
                                  )}
                                </div>
                              </div>
                            </SectionCard>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
      {exportModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Exportar Excel de encuestas
                </p>
                <p className="text-xs text-emerald-500">
                  Selecciona departamento y ciudad (opcional) para filtrar el archivo.
                </p>
              </div>
              <button
                className="rounded-md p-1 text-emerald-700 transition hover:bg-emerald-50"
                type="button"
                onClick={() => setExportModalOpen(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm font-semibold text-emerald-700">
                Departamento
                <select
                  className="mt-1 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  value={exportDepartment}
                  onChange={(e) => {
                    const dept = e.target.value as (typeof SUMMARY_DEPARTMENTS)[number];
                    setExportDepartment(dept);
                    setExportCity(undefined);
                  }}
                >
                  {SUMMARY_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-emerald-700">
                Ciudad (opcional)
                <select
                  className="mt-1 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  value={selectedExportCity}
                  onChange={(e) => setExportCity(e.target.value || undefined)}
                >
                  <option value="">(Sin filtro)</option>
                  {exportCityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {exportError ? (
              <p className="mt-3 text-sm font-semibold text-red-600">{exportError}</p>
            ) : null}

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-md border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900"
                type="button"
                onClick={() => setExportModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-emerald-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={handleExport}
                disabled={exportLoading}
              >
                {exportLoading ? "Descargando..." : "Descargar Excel"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
