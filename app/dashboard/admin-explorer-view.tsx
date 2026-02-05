"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Session } from "next-auth";
import Link from "next/link";
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
  FiMenu,
  FiRefreshCcw,
} from "react-icons/fi";

import {
  Extensionist,
  ExtensionistFilters,
  fetchExtensionistsFull,
} from "@/services/extensionists";
import {
  ExtensionistProperty,
  ExtensionistProducer,
  ExtensionistProducerProperty,
  fetchProducerSurveyVisit,
  fetchExtensionistProducers,
  SurveysStateSummaryBucket,
  SurveysStateSummary,
  type PropertySurveyVisit,
  updateSurveyState,
  basicUpdateSurvey,
  exportExtensionistExcel,
} from "@/services/properties";
import {
  fetchSurveyStatistics,
  fetchSurveySummaryByCity,
  type CitySurveySummary,
  exportSurveyExcel,
} from "@/services/statistics";
import {
  SkeletonStatsGrid,
  SkeletonTable,
  SkeletonPropertiesList,
  SkeletonPropertiesSummary,
  SkeletonChart,
} from "@/components/ui/Skeleton";
import { ImageModal } from "@/components/ui/Modal";
import { CityChart } from "./charts/CityChart";
import { GeneralSummaryChart } from "./charts/GeneralSummaryChart";

type SessionWithToken = Session & { accessToken?: string; tokenType?: string };

const SECTION_CLASS =
  "rounded-2xl bg-white p-4 md:p-6 shadow-sm ring-1 ring-emerald-100 flex flex-col gap-4 overflow-hidden";

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
  type?: "text" | "textarea" | "select" | "date" | "time";
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
          className={`${baseClasses} mt-2 min-h-24 ${readOnly ? disabledClasses : ""}`}
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
          type={type === "date" ? "date" : type === "time" ? "time" : "text"}
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
    "Ariguaní",
    "Aracataca",
    "Cerro San Antonio",
    "Chivolo",
    "Ciénaga",
    "Concordia",
    "El Banco",
    "El Piñón",
    "Fundación",
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
    "Ariguaní",
    "Aracataca",
    "Cerro San Antonio",
    "Chivolo",
    "Ciénaga",
    "Concordia",
    "El Banco",
    "El Piñón",
    "Fundación",
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

type AdminExplorerViewProps = {
  initialView?: "stats" | "visits" | "reports";
};

type ExtensionistPropertyApi = ExtensionistProperty & {
  linea_productive_primary?: string;
  linea_productive_secondary?: string;
  area_in_production?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  created_at?: string;
  surveys?: {
    type_1?: { states?: string[] };
    type_2?: { states?: string[] };
    type_3?: { states?: string[] };
  };
  asnm?: number | string | null;
};

type EditableVisit = (PropertySurveyVisit & { approval_profile?: string }) & Record<string, unknown>;
type EditableProducer =
  ({ name?: string; type_id?: string; identification?: string; number_phone?: string } &
    Record<string, unknown>);
type EditablePropertyState = (ExtensionistPropertyApi & Record<string, unknown>) | null;
type StateCountEntry = { value?: string; count?: number };
type SurveySummaryEntry = {
  count?: number;
  latest_visit?: string | null;
  file_pdf?: string | null;
  states?: string[];
};
type VisitExtensionist = {
  name?: string;
  identification?: string;
  signing_image_path?: string;
} & Record<string, unknown>;

type ApiErrorPayload = { message?: string };
type ApiErrorShape = { response?: { data?: ApiErrorPayload }; message?: string };

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const maybeError = error as ApiErrorShape;
    const responseMessage = maybeError.response?.data?.message;
    if (typeof responseMessage === "string" && responseMessage.trim()) {
      return responseMessage;
    }
    if (typeof maybeError.message === "string" && maybeError.message.trim()) {
      return maybeError.message;
    }
  }
  return fallback;
};

export const AdminExplorerView = ({ initialView = "stats" }: AdminExplorerViewProps) => {
  const { data: session } = useSession();
  const sessionWithToken = session as SessionWithToken | null;
  const accessToken = sessionWithToken?.accessToken;
  const tokenType = sessionWithToken?.tokenType ?? "Token";
  const rawName =
    sessionWithToken?.user?.name ??
    sessionWithToken?.user?.email ??
    "";
  const userName = rawName.trim();
  const normalizedRole = userName.toLowerCase();
  const isRestricted =
    normalizedRole === "coordinador" || normalizedRole === "revisor";
  const isDecisionReadOnly = normalizedRole === "revisor_editor";
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
  const [editableVisit, setEditableVisit] = useState<EditableVisit | null>(null);
  const [editableProducer, setEditableProducer] = useState<EditableProducer | null>(null);
  const [editableProperty, setEditableProperty] =
    useState<EditablePropertyState>(null);
  const [approvalProfile, setApprovalProfile] = useState("");
  const [selectedProfileName, setSelectedProfileName] = useState("");
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
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
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
  const [reportNameFilter, setReportNameFilter] = useState("");
  const [reportEmailFilter, setReportEmailFilter] = useState("");
  const [reportPage, setReportPage] = useState(1);
  const [reportExpandedProducerId, setReportExpandedProducerId] = useState<number | null>(null);
  const [reportExporting, setReportExporting] = useState(false);
  const [reportExportError, setReportExportError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"stats" | "visits" | "reports">(
    initialView,
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProducer, setSelectedProducer] = useState<ExtensionistProducer | null>(null);
  const [expandedProducerId, setExpandedProducerId] = useState<number | null>(null);
  const [producerSearch, setProducerSearch] = useState("");
  const [producerPage, setProducerPage] = useState(1);
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
    setSelectedProfileName("");
    setDecisionReason("");
    setDecisionError(null);
    setUpdateMessage(null);
    setUpdateError(null);
    setUpdateFiles({});
    setSelectedProducer(null);
    setExpandedProducerId(null);
    setReportExpandedProducerId(null);
    setProducerSearch("");
    setProducerPage(1);
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
    const matchesName = reportNameFilter
      ? ext.name.toLowerCase().includes(reportNameFilter.toLowerCase().trim())
      : true;
    const matchesEmail = reportEmailFilter
      ? (ext.email ?? "").toLowerCase().includes(reportEmailFilter.toLowerCase().trim())
      : true;
    return matchesName && matchesEmail;
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
    {
      survey_1: { pending: 0, accepted: 0, rejected: 0 },
      survey_2: { pending: 0, accepted: 0, rejected: 0 },
      survey_3: { pending: 0, accepted: 0, rejected: 0 },
    },
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
    data: extensionistProducersResponse,
    isLoading: producersLoading,
    isError: producersError,
    error: producersFetchError,
    isFetching: producersFetching,
    refetch: refetchExtensionistProducers,
  } = useQuery({
    queryKey: [
      "extensionist-producers",
      selectedExtensionist?.id,
      accessToken,
      tokenType,
    ],
    queryFn: () =>
      fetchExtensionistProducers(selectedExtensionist!.id, accessToken, tokenType),
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
      "producer-survey-visit",
      selectedProducer?.id,
      selectedVisit,
      accessToken,
      tokenType,
    ],
    queryFn: () =>
      fetchProducerSurveyVisit(
        selectedProducer!.id,
        selectedVisit!,
        accessToken,
        tokenType,
      ),
    enabled: Boolean(selectedProducer && selectedVisit && accessToken),
  });

  const {
    data: citySummaryResponse,
    isLoading: citySummaryLoading,
    isError: citySummaryError,
    error: citySummaryFetchError,
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

  const summaryData = extensionistProducersResponse?.data;
  const summaryExtensionist = summaryData?.extensionist as Extensionist | undefined;
  const producers = summaryData?.producers ?? [];
  const baseSummaryBucket: SurveysStateSummaryBucket = {
    pending: 0,
    accepted: 0,
    rejected: 0,
    count: 0,
  };
  const baseProducersSummary: SurveysStateSummary = {
    survey_1: { ...baseSummaryBucket },
    survey_2: { ...baseSummaryBucket },
    survey_3: { ...baseSummaryBucket },
  };
  const producersSummary =
    summaryData?.surveys_state_summary ??
    summaryData?.states_summary ??
    baseProducersSummary;
  const filteredProducers = producers.filter((producer) =>
    [producer.name, producer.identification, producer.phone]
      .filter(Boolean)
      .some((field) =>
        String(field ?? "")
          .toLowerCase()
          .includes(producerSearch.toLowerCase().trim()),
      ),
  );
  const producerPageSize = 5;
  const producersTotalPages = Math.max(
    1,
    Math.ceil(filteredProducers.length / producerPageSize),
  );
  const currentProducerPageSafe = Math.min(producerPage, producersTotalPages);
  const paginatedProducers = filteredProducers.slice(
    (currentProducerPageSafe - 1) * producerPageSize,
    currentProducerPageSafe * producerPageSize,
  );
  const normalizeProducerProperty = (
    property?:
      | ExtensionistProducerProperty
      | ExtensionistProperty
      | (Record<string, unknown> & { id?: number })
      | null,
  ): ExtensionistPropertyApi | null => {
    if (!property) return null;
    const raw = property as any;
    const primaryLine =
      raw.linea_productive_primary ?? raw.primaryLine ?? raw.lineaProductivePrimary;
    const secondaryLine =
      raw.linea_productive_secondary ?? raw.secondaryLine ?? raw.lineaProductiveSecondary;
    const areaRaw = raw.area_in_production ?? raw.areaInProduction;
    const lat = raw.latitude ?? raw.lat;
    const lng = raw.longitude ?? raw.lng;
    return {
      id: raw.id ?? raw.property_id ?? 0,
      name: raw.name ?? raw.property_name ?? "Predio sin nombre",
      city: raw.city ?? raw.municipality,
      municipality: raw.municipality ?? raw.city,
      state: raw.state,
      village: raw.village,
      primaryLine,
      secondaryLine,
      linea_productive_primary: primaryLine,
      linea_productive_secondary: secondaryLine,
      areaInProduction:
        areaRaw !== undefined && areaRaw !== null ? String(areaRaw) : undefined,
      area_in_production: areaRaw,
      latitude: lat !== undefined && lat !== null ? String(lat) : undefined,
      longitude: lng !== undefined && lng !== null ? String(lng) : undefined,
      asnm: raw.asnm,
    };
  };

  const isSameProperty = (a?: unknown, b?: ExtensionistPropertyApi | null) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    const keys: Array<keyof ExtensionistPropertyApi> = [
      "id",
      "name",
      "city",
      "municipality",
      "state",
      "village",
      "primaryLine",
      "secondaryLine",
      "linea_productive_primary",
      "linea_productive_secondary",
      "areaInProduction",
      "area_in_production",
      "latitude",
      "longitude",
      "asnm",
    ];
    return keys.every((key) => (a as any)[key] === (b as any)[key]);
  };
  const mapProducerPropertyToProperty = (
    property?: ExtensionistProducerProperty | null,
  ): ExtensionistPropertyApi | null => {
    return normalizeProducerProperty(property);
  };

  const summarizeStatesArray = (states?: string[]) =>
    (states ?? []).reduce<Record<string, number>>((acc, state) => {
      acc[state] = (acc[state] ?? 0) + 1;
      return acc;
    }, {});

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
    if (isRestricted && activeView === "visits") {
      setActiveView("stats");
    }
  }, [isRestricted, activeView]);

  useEffect(() => {
    if (activeView === "stats" && accessToken) {
      void refetchStats();
    }
  }, [activeView, accessToken, refetchStats]);

  const handleExtensionistSelect = (extensionist: Extensionist) => {
    setSelectedExtensionist(extensionist);
    setSelectedProducer(null);
    setExpandedProducerId(null);
    setReportExpandedProducerId(null);
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
    setProducerSearch("");
    setProducerPage(1);

    // Scroll to productores section after a short delay to ensure DOM update
    setTimeout(() => {
      propertiesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const propertiesSectionRef = useRef<HTMLElement>(null);
  const propertySurveysSectionRef = useRef<HTMLElement>(null);

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

// Keep visit date/time exactly as entered by the user (store in UTC, show in local)
const STORAGE_TIME_OFFSET_MINUTES = 5 * 60; // backend keeps UTC; user selects in UTC-5
const DISPLAY_OFFSET_MINUTES = 0;

const shiftMinutes = (value?: string | null, minutes: number = 0) => {
  if (!value) return null;
  if (!value.includes("T")) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getTime() + minutes * 60 * 1000);
};

const shiftToOffset = (value?: string | null) => shiftMinutes(value, DISPLAY_OFFSET_MINUTES);
const shiftFromStorage = (value?: string | null) =>
  shiftMinutes(value, -STORAGE_TIME_OFFSET_MINUTES);

const formatDate = (value?: string | null) => {
  if (!value) return undefined;
  const shifted = shiftFromStorage(value) ?? shiftToOffset(value);
  if (shifted) {
    const yyyy = shifted.getFullYear();
    const mm = String(shifted.getMonth() + 1).padStart(2, "0");
    const dd = String(shifted.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  const dateMatch = value.match(/(\d{4}-\d{2}-\d{2})/);
  return dateMatch ? dateMatch[1] : value;
};

  const formatDateWithTime = (date?: string | null, time?: string | null) => {
    const datePart = formatDate(date);
    if (!datePart) return undefined;
    return time ? `${datePart} ${time}`.trim() : datePart;
  };

const getDatePart = (value?: string | null) => {
  if (!value) return "";
  const parsed = shiftFromStorage(value) ?? new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  const dateMatch = value.match(/(\d{4}-\d{2}-\d{2})/);
  return dateMatch ? dateMatch[1] : "";
};

const getTimePart = (value?: string | null) => {
  if (!value) return "";
  const parsed = shiftFromStorage(value) ?? new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const hh = String(parsed.getHours()).padStart(2, "0");
    const mm = String(parsed.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  const timeMatch = value.match(/T(\d{2}:\d{2})/);
  if (timeMatch) return timeMatch[1];
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  return "";
};

  const formatVisitStamp = (value?: string | null) => {
    const datePart = getDatePart(value);
    if (!datePart) return undefined;
    const timePart = getTimePart(value);
    return formatDateWithTime(datePart, timePart ?? undefined);
  };

  const CLASSIFICATION_LABELS: Record<string, string> = {
    main_productive_activity: "Actividad productiva principal",
    secondary_productive_activities: "Actividades productivas secundarias",
    tools_and_equipment: "Herramientas y equipos",
    good_agricultural_practices: "Buenas prácticas agrícolas",
    commercialization_structure: "Estructura de comercialización",
    markets: "Acceso a mercados",
    added_value: "Valor agregado",
    records: "Registros (contables/productivos)",
    labor_type: "Tipo de mano de obra",
    credit_and_banking: "Acceso a crédito y servicios bancarios",
    organization_membership: "Pertenencia a organizaciones",
    collective_activities: "Actividades colectivas",
    entrepreneurship_associativity: "Emprendimiento y asociatividad",
    commercial_alliances: "Alianzas comerciales",
    technical_support: "Asistencia / apoyo técnico",
    quality_certifications: "Certificaciones de calidad",
    intellectual_property: "Propiedad intelectual",
    access_information_sources: "Acceso a fuentes de información",
    access_to_ict: "Acceso a TIC",
    use_of_ict_decision: "Uso de TIC para la toma de decisiones",
    ict_skills: "Habilidades en TIC",
    knowledge_appropriation: "Apropiación del conocimiento",
    environmental_practices: "Prácticas ambientales",
    sustainable_practices: "Prácticas sostenibles",
    climate_change_adaptation: "Adaptación al cambio climático",
    environmental_regulations: "Cumplimiento de normatividad ambiental",
    participation_mechanisms: "Mecanismos de participación",
    participation_tools: "Herramientas de participación",
    political_social_control: "Control político y social",
    community_self_management: "Autogestión comunitaria",
  };

  const FOCALIZATION_LABELS: Record<string, string> = {
    productive_focus: "Enfoque productivo",
    organizational_focus: "Enfoque organizacional",
    commercial_focus: "Enfoque comercial",
    social_focus: "Enfoque social",
    gender_focus: "Enfoque de género",
    youth_focus: "Enfoque de juventud",
    victim_focus: "Enfoque de víctimas",
    ethnic_focus: "Enfoque étnico",
    disability_focus: "Enfoque discapacidad",
    poverty_focus: "Enfoque pobreza",
  };

  const LABEL_OVERRIDES: Record<string, string> = {
    ...CLASSIFICATION_LABELS,
    ...FOCALIZATION_LABELS,
    control_resources: "Control de recursos",
    dialogue_knowledge: "Diálogo de conocimientos",
    leadership_innovation: "Liderazgo e innovación",
    voice_influence_decision: "Voz e influencia en la decisión",
  };

  const SPANISH_SEGMENT_MAP: Record<string, string> = {
    access: "Acceso",
    activities: "Actividades",
    activity: "Actividad",
    added: "Agregado",
    adaptation: "Adaptación",
    alliances: "Alianzas",
    agricultural: "Agrícolas",
    appropriation: "Apropiación",
    banking: "Banca",
    change: "Cambio",
    climate: "Clima",
    collective: "Colectiva",
    commercial: "Comercial",
    community: "Comunidad",
    control: "Control",
    credit: "Crédito",
    decision: "Decisión",
    decisions: "Decisiones",
    disability: "Discapacidad",
    environmental: "Ambiental",
    ethnic: "Étnico",
    focus: "Foco",
    focalization: "Focalización",
    good: "Buenas",
    information: "Información",
    intellectual: "Propiedad intelectual",
    knowledge: "Conocimiento",
    labor: "Mano de obra",
    main: "Principal",
    management: "Gestión",
    markets: "Mercados",
    mechanisms: "Mecanismos",
    membership: "Pertenencia",
    observation: "Observación",
    organizational: "Organizacional",
    participation: "Participación",
    political: "Político",
    poverty: "Pobreza",
    practices: "Prácticas",
    production: "Producción",
    productive: "Productiva",
    property: "Propiedad",
    quality: "Calidad",
    records: "Registros",
    regulations: "Normatividad",
    rural: "Rural",
    secondary: "Secundaria",
    self: "Auto",
    skills: "Habilidades",
    social: "Social",
    social_control: "Control social",
    sources: "Fuentes",
    support: "Apoyo",
    sustainable: "Sostenible",
    sustainability: "Sostenibilidad",
    technical: "Técnico",
    tools: "Herramientas",
    type: "Tipo",
    up: "UP",
    use: "Uso",
    value: "Valor",
    victim: "Víctima",
    victims: "Víctimas",
    vulnerability: "Vulnerabilidad",
    women: "Mujeres",
    woman: "Mujer",
    youth: "Juventud",
    young: "Joven",
    ict: "TIC",
  };

  const PROFESSIONAL_PROFILES: Array<{ name: string; profile: string }> = [
    { name: "Jhoana Ester Orjuela", profile: "Ing. Agrónomo" },
    { name: "Anibal Trillos Sanchez", profile: "Técnico" },
    { name: "Wilfrido José Roca Lanao", profile: "Ing. Agrónomo" },
    { name: "Anyela Johana Camacho Muñoz", profile: "Ing. Agrónomo" },
    { name: "Cristina Isabel Clavijo Duarte", profile: "Bióloga" },
    { name: "Jose Albeiro Pallares Castaño", profile: "Ing. Agrónomo" },
    { name: "Juana Iris Lineros", profile: "Ing. Ambiental" },
    { name: "Edgardo Javier Vizcaino Rocha", profile: "Técnico Agropecuario" },
    { name: "Luis Guillermo Calderón Seohanez", profile: "Medico Veterinario Y Zootecnista" },
    { name: "Fredy De Jesus Mendoza Ballestas", profile: "Técnico Agropecuario" },
    { name: "Jhonatan Smit Bolaño Domínguez", profile: "Biólogo" },
    { name: "Alejandra Isabel Suarez Melendez", profile: "Ing. Ambiental" },
    { name: "Luis Carlos Barros Restrepo", profile: "Medico Veterinario Y Zootecnista" },
    { name: "Adalberto Valdez Buelvas", profile: "Tecnico En Produccion Agropecuaria" },
    { name: "Sandra Milena Pérez López", profile: "Bióloga" },
    { name: "NERANDIS RAFAEL PEREA ORTIZ", profile: "Técnico Profesional en Administración de Empresas Agropecuarias" },
    { name: "ANGIE PATRICIA BARBOSA  GARCIA", profile: "Ing. Agrónomo" },
    { name: "Karen Margarita Silva Benitez", profile: "Tecnólogo En Producción Agricola" },
    { name: "Yuris German Beleño Ospino", profile: "Tecnico Agropecuario" },
    { name: "Holmes Enrique Farelo Aroca", profile: "Medico Veterinario" },
    { name: "BERLEDYS OLIVETT PEREZ FERNANDEZ", profile: "Tecnico" },
    { name: "Pablo De La Cruz Toloza", profile: "Tecnico" },
    { name: "Maryuris Castillo Carrasquilla", profile: "Ingeniera Ambiental" },
    { name: "Fabio Manuel Bernal Cisneros", profile: "Tecnico Reproducción Animal" },
    { name: "LUIS ESTEBAN MARRIAGA PIMIENTA", profile: "Medico Veterinario Y Zootecnista" },
    { name: "MARCO  DAVID TOVAR OBREGON", profile: "Médico Veterinario" },
    { name: "ENDER RAFAEL ALVAREZ BARROS", profile: "Médico Veterinario" },
    { name: "RAMIRO DEL TORO", profile: "Médico Veterinario" },
    { name: "Andrés Avelino Meza Orozco", profile: "Médico Veterinario Zootecnista" },
    { name: "ANDRES CAMILO MAESTRE VIVES", profile: "Ing. Agrónomo" },
    { name: "JUAN CAMILO  RONCALLO SALCEDO", profile: "Ing. Agrónomo" },
    { name: "Aldo De Jesus Cormane Carranza", profile: "Técnologo Empresas Agropecuarias" },
    { name: "FABIAN JESUS BALLESTA BRIEVA", profile: "Médico Veterinario" },
    { name: "Misael Adolfo Rico Torregroza", profile: "Ing. Agrónomo" },
    { name: "Julitza Marcela Fuentes Polo", profile: "Ing. Agrónomo" },
    { name: "Eder Miguel Vizcaíno Acuña", profile: "Tecnólogo En Administración De Empresas Agropecuarias" },
    { name: "Miguel Rafael Salas Romo", profile: "Ing. Agrónomo" },
    { name: "Jose Eliecer Rodriguez Cera", profile: "Médico Veterinario Zootecnista" },
    { name: "ELIANA DIAZ MARTINEZ", profile: "Tecnico En Administracion De Empresas Agropecuarias" },
    { name: "Maria Concepcion Torregrosa Garcia", profile: "Tecnico En Administracion De Empresas Agropecuarias" },
    { name: "Ana Maria Noguera Teran", profile: "Ing. Agrónomo" },
    { name: "Alberto Movilla De La Cruz", profile: "Médico Veterinario" },
    { name: "Jesus David Martinez Diaz", profile: "Ing. Agrónomo" },
    { name: "Noelia Esster Correa Rodriguez", profile: "Tecnólogo En Administración De Empresas Agropecuarias" },
    { name: "María Fernanda Díaz Correa", profile: "Técnico En Cultivos Vegetales" },
    { name: "Betsy Maria Cadena López", profile: "Ing. Agrónomo" },
    { name: "Hector Moreno Cantillo", profile: "Medico Veterinario Zootecnista" },
    { name: "Elbanis Elena Bastidas Castrillo", profile: "Ing. Ambiental y Técnico en explotaciones agropecuarias" },
    { name: "Andrea Patricia Turizo Quevedo", profile: "Ing. Agrónomo" },
    { name: "Mario Fernández", profile: "Técnico Empresas Agropecuarias" },
    { name: "Guido Patiño", profile: "Técnico Empresas Agropecuarias" },
    { name: "Ivan Peña", profile: "Ing. Agroindustrial" },
    { name: "Charol Caraballo", profile: "Ing. Agroindustrial" },
    { name: "Oscar Polo", profile: "Ing. Agroindustrial" },
    { name: "Miguel Olmos", profile: "Ing. Agroindustrial" },
    { name: "Gladys Zabala", profile: "Ing. Ambiental" },
    { name: "Marcel Valdez", profile: "Biólogo" },
    { name: "Fredy Bula", profile: "Técnico Agropecuario" },
    { name: "Pedro Medina", profile: "Médico Veterinario" },
    { name: "Claudia Robles", profile: "Ing. Agroindustrial" },
    { name: "Celina Correa", profile: "Ing. Agrónomo" },
    { name: "Sugey Martínez", profile: "Médico Veterinario" },
    { name: "Herwy Paternina", profile: "Zootecnista" },
    { name: "Julia Villa", profile: "Técnico" },
    { name: "Darío Pacheco", profile: "Ing. Agrónomo" },
    { name: "José Arias", profile: "Tecnólogo en piscicultura" },
    { name: "Enrique Barrios", profile: "Técnico Agropecuario" },
    { name: "Alberto Oliveros", profile: "Técnico Agropecuario" },
    { name: "Yohan Lechuga", profile: "Médico Veterinario" },
  ];
  const NAME_TO_PROFILE = PROFESSIONAL_PROFILES.reduce<Record<string, string>>(
    (acc, item) => {
      acc[item.name] = item.profile;
      return acc;
    },
    {},
  );
  const UNIQUE_PROFILE_OPTIONS = Array.from(
    new Set(PROFESSIONAL_PROFILES.map((item) => item.profile.trim()).filter(Boolean)),
  );
  const NAME_OPTIONS = Object.keys(NAME_TO_PROFILE);

  const normalizeKey = (key: string) =>
    key
      .trim()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_")
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .toLowerCase();

  const prettifyKey = (key: string) => {
    const normalizedKey = normalizeKey(key);
    const dictionaryLabel = LABEL_OVERRIDES[normalizedKey];
    if (dictionaryLabel) return dictionaryLabel;

    const label = normalizedKey
      .split("_")
      .filter(Boolean)
      .map((segment) => {
        const translatedSegment = SPANISH_SEGMENT_MAP[segment] ?? segment;
        const cleanedSegment = translatedSegment.trim();
        if (!cleanedSegment) return "";
        return cleanedSegment.charAt(0).toUpperCase() + cleanedSegment.slice(1);
      })
      .filter(Boolean)
      .join(" ")
      .replace(/\bTic\b/g, "TIC")
      .replace(/\bUp\b/g, "UP");

    return label;
  };
  const normalizeMediaUrl = (url?: string | null) => {
    if (!url) return url ?? undefined;
    const lastHttps = url.lastIndexOf("https://");
    const lastHttp = url.lastIndexOf("http://");
    const lastProtocolIndex = Math.max(lastHttps, lastHttp);
    if (lastProtocolIndex > 0) {
      return url.slice(lastProtocolIndex);
    }
    return url;
  };
  const renderVisitStates = (
    extensionist: Extensionist,
    key: "survey_1" | "survey_2" | "survey_3",
  ) => {
    const bucket = extensionist.surveys_state_summary?.[key] ?? {};
    const pending = bucket.pending ?? 0;
    const accepted = bucket.accepted ?? 0;
    const rejected = bucket.rejected ?? 0;
    const total = pending + accepted + rejected;

    if (total === 0) {
      return (
        <span className="text-xs text-slate-400 italic">Sin visitas</span>
      );
    }

    return (
      <div className="flex items-center gap-1.5">
        {pending > 0 && (
          <span
            className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20"
            title={`Pendientes: ${pending}`}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {pending}
          </span>
        )}
        {accepted > 0 && (
          <span
            className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
            title={`Aceptadas: ${accepted}`}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            {accepted}
          </span>
        )}
        {rejected > 0 && (
          <span
            className="inline-flex items-center gap-0.5 rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20"
            title={`Rechazadas: ${rejected}`}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            {rejected}
          </span>
        )}
      </div>
    );
  };

  const renderPropertyVisitStates = (
    summary?: SurveysStateSummaryBucket,
  ) => {
    const pending = summary?.pending ?? 0;
    const accepted = summary?.accepted ?? 0;
    const rejected = summary?.rejected ?? 0;
    const total = pending + accepted + rejected;

    if (total === 0) {
      return (
        <span className="text-[11px] text-slate-400 italic">—</span>
      );
    }

    return (
      <div className="flex items-center gap-1">
        {pending > 0 && (
          <span
            className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20"
            title={`Pendientes: ${pending}`}
          >
            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {pending}
          </span>
        )}
        {accepted > 0 && (
          <span
            className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
            title={`Aceptadas: ${accepted}`}
          >
            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            {accepted}
          </span>
        )}
        {rejected > 0 && (
          <span
            className="inline-flex items-center gap-0.5 rounded bg-red-50 px-1 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-inset ring-red-600/20"
            title={`Rechazadas: ${rejected}`}
          >
            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            {rejected}
          </span>
        )}
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
  const visitPropertyData = useMemo(
    () =>
      normalizeProducerProperty(
        (surveyVisitData?.property as ExtensionistProperty | undefined) ??
          (visitDetail?.property as ExtensionistProperty | undefined) ??
          selectedProperty,
      ),
    [surveyVisitData?.property, visitDetail?.property, selectedProperty],
  );
  const visitProducer = surveyVisitData?.producer as
    | Record<string, unknown>
    | undefined;
  const visitExtensionist = visitDetail?.extensionist as VisitExtensionist | undefined;
  const [initialVisit, setInitialVisit] = useState<Record<string, unknown> | null>(null);
  const [initialProducer, setInitialProducer] = useState<Record<string, unknown> | null>(null);
  const [initialProperty, setInitialProperty] = useState<Record<string, unknown> | null>(null);
  const classificationEntries = Object.entries(
    visitDetail?.classification_user?.detail ?? {},
  );
  const classificationTotal = visitDetail?.classification_user?.total;
  const focalizationEntries = Object.entries(
    (editableVisit as any)?.medition_focalization ??
      visitDetail?.medition_focalization ??
      {},
  );
  const photoGallery = (
    [
      { label: "Foto del productor", url: normalizeMediaUrl(visitDetail?.photo_user) },
      { label: "Foto de interacción", url: normalizeMediaUrl(visitDetail?.photo_interaction) },
      { label: "Panorama", url: normalizeMediaUrl(visitDetail?.photo_panorama) },
      { label: "Foto adicional", url: normalizeMediaUrl(visitDetail?.phono_extra_1) },
    ] as const
  )
    .filter((photo) => Boolean(photo.url))
    .map((photo) => ({ label: photo.label as string, url: photo.url as string }));

  useEffect(() => {
    if (visitDetail) {
      setEditableVisit({
        ...visitDetail,
        origen_register: visitDetail.origen_register ?? "app_movil",
        attended_by: visitDetail.attended_by ?? "Usuario Productor",
        approval_profile: visitDetail.approval_profile ?? "",
      });
      setApprovalProfile(visitDetail.approval_profile ?? "");
      setInitialVisit(visitDetail as Record<string, unknown>);
    } else {
      setEditableVisit(null);
      setApprovalProfile("");
      setInitialVisit(null);
    }
    setUpdateMessage(null);
    setUpdateError(null);
    setUpdateFiles({});
  }, [visitDetail]);

  useEffect(() => {
    setEditableProducer(visitProducer ? { ...visitProducer } : null);
    setInitialProducer(visitProducer ? { ...visitProducer } : null);
  }, [visitProducer]);

  useEffect(() => {
    if (visitPropertyData) {
      const mapped = { ...visitPropertyData } as ExtensionistPropertyApi & Record<string, unknown>;
      setEditableProperty((prev) => (isSameProperty(prev, mapped) ? prev : mapped));
      setInitialProperty((prev) => (isSameProperty(prev, mapped) ? prev : mapped));
      if (mapped.id) {
        setSelectedProperty((prev) =>
          isSameProperty(prev as unknown, mapped)
            ? prev
            : (mapped as ExtensionistProperty),
        );
      }
    } else {
      setEditableProperty(null);
      setInitialProperty(null);
    }
  }, [visitPropertyData]);

  const clearUpdateFeedback = () => {
    setUpdateMessage(null);
    setUpdateError(null);
  };

  const updateVisitField = (key: string, value: string) => {
    clearUpdateFeedback();
    setEditableVisit((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateVisitDateTime = (date?: string, time?: string) => {
    const currentDate =
      date ??
      getDatePart((editableVisit as any)?.date_hour_end ?? (editableVisit as any)?.visit_date);
    const currentTime =
      time ?? getTimePart((editableVisit as any)?.date_hour_end ?? (editableVisit as any)?.visit_date);
    if (!currentDate) return;
    const baseUtc = new Date(`${currentDate}T${(currentTime || "00:00").padStart(5, "0")}:00Z`);
    if (Number.isNaN(baseUtc.getTime())) return;
    const shifted = new Date(baseUtc.getTime() + STORAGE_TIME_OFFSET_MINUTES * 60 * 1000);
    const combined = shifted.toISOString().replace(/\.\d{3}Z$/, "Z");
    setEditableVisit((prev) =>
      prev
        ? {
            ...prev,
            date_hour_end: combined,
          }
        : prev,
    );
  };

  const updateFocalizationObservation = (focalKey: string, value: string) => {
    clearUpdateFeedback();
    setEditableVisit((prev) => {
      if (!prev) return prev;
      const current = (prev as any).medition_focalization ?? {};
      const entry = current[focalKey] ?? {};
      return {
        ...prev,
        medition_focalization: {
          ...current,
          [focalKey]: { ...entry, obervation: value },
        },
      };
    });
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

  const diffPayload = (
    current?: Record<string, unknown> | null,
    original?: Record<string, unknown> | null,
    allowedKeys?: string[],
  ) => {
    if (!current) return undefined;
    const payload: Record<string, unknown> = {};
    Object.entries(current).forEach(([key, value]) => {
      if (allowedKeys && !allowedKeys.includes(key)) return;
      const originalValue = original ? original[key] : undefined;
      if (value !== originalValue) {
        payload[key] = value;
      }
    });
    return cleanPayload(payload);
  };

  const buildSurveyPayload = () => {
    if (!editableVisit) return undefined;
    const allowedKeys = [
      "objetive_accompaniment",
      "initial_diagnosis",
      "recommendations_commitments",
      "observations_visited",
      "compliance_status",
      "visit_date",
      "date_hour_end",
      "origen_register",
      "name_acompanamiento",
      "attended_by",
      "attendee_role",
      "state",
      "medition_focalization",
    ];
    return diffPayload(
      editableVisit as Record<string, unknown>,
      initialVisit,
      allowedKeys,
    );
  };

  const buildProducerPayload = () => {
    if (!editableProducer) return undefined;
    return diffPayload(
      editableProducer as Record<string, unknown>,
      initialProducer,
      ["name", "type_id", "identification", "number_phone"],
    );
  };

  const buildPropertyPayload = () => {
    if (!editableProperty) return undefined;
    const source = editableProperty as Record<string, unknown>;
    const original = initialProperty;
    const normalizeValue = (value: unknown) => {
      if (value === undefined) return undefined;
      if (typeof value === "string" && value.trim() === "") return null;
      return value;
    };
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
      const currentValue = normalizeValue(
        candidates.map((k) => source[k]).find((v) => v !== undefined),
      );
      const originalValue = normalizeValue(
        candidates.map((k) => (original as any)?.[k]).find((v) => v !== undefined),
      );
      if (currentValue !== undefined && currentValue !== originalValue) {
        payload[target] = currentValue;
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
  const matchedDepartment =
    typeof editableProperty?.state === "string"
      ? DEPARTMENTS.find(
          (dep) => dep.toLowerCase() === (editableProperty.state as string).toLowerCase(),
        ) ?? (editableProperty.state as string)
      : undefined;
  const departmentOptions = Array.from(
    new Set([...(DEPARTMENTS as readonly string[]), ...(matchedDepartment ? [matchedDepartment] : [])]),
  );
  const baseMunicipalities =
    matchedDepartment && MUNICIPALITIES[matchedDepartment as keyof typeof MUNICIPALITIES]
      ? MUNICIPALITIES[matchedDepartment as keyof typeof MUNICIPALITIES]
      : [];
  const availableMunicipalities = Array.from(
    new Set([
      ...baseMunicipalities,
      ...(editableProperty?.city ? [editableProperty.city] : []),
      ...(editableProperty?.municipality ? [editableProperty.municipality] : []),
    ].filter(Boolean) as string[]),
  );
  const { mutateAsync: mutateSurveyState, isPending: decisionLoading } = useMutation({
    mutationFn: updateSurveyState,
  });
  const { mutateAsync: mutateBasicUpdate, isPending: updatingVisit } = useMutation({
    mutationFn: basicUpdateSurvey,
  });

  const handleDecisionSubmit = async (state: "accepted" | "rejected") => {
    if (isDecisionReadOnly) {
      setDecisionError("Tu rol no permite aceptar o rechazar visitas.");
      return;
    }
    if (state === "accepted" && !approvalProfile.trim()) {
      setDecisionError("Agrega el perfil antes de aceptar.");
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
        perfil: state === "accepted" ? approvalProfile.trim() : undefined,
        token: accessToken,
        tokenType,
      });
      if (response?.data) {
        setEditableVisit(response.data as Record<string, unknown>);
        setVisitDecision(state);
      }
      await refetchSurveyVisit();
      if (selectedExtensionist) {
        await refetchExtensionistProducers();
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error, "No fue posible actualizar el estado.");
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
    } catch (error: unknown) {
      const message = getErrorMessage(error, "No fue posible actualizar la encuesta.");
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
    } catch (error: unknown) {
      const message = getErrorMessage(error, "No fue posible descargar el Excel.");
      setExportError(message);
    }
  };
  return (
    <div className="flex min-h-screen bg-emerald-50">
      <aside className="fixed left-0 top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col gap-2 overflow-y-auto bg-white p-6 shadow-sm ring-1 ring-emerald-100 lg:flex">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            Navegación
          </p>
          <h2 className="text-lg font-semibold text-emerald-900">
            Panel principal
          </h2>
        </div>
        <nav className="space-y-2">
          <Link
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${activeView === "stats"
              ? "bg-emerald-900 text-white"
              : "text-emerald-900 hover:bg-emerald-50"
              }`}
            href="/dashboard"
          >
            <FiBarChart2
              className={activeView === "stats" ? "text-white" : "text-emerald-500"}
              aria-hidden
              />
              Estadística
            </Link>
          {!isRestricted ? (
            <Link
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${activeView === "visits"
                ? "bg-emerald-900 text-white"
                : "text-emerald-900 hover:bg-emerald-50"
                }`}
            href="/dashboard/visitas"
          >
            <FiActivity
              className={
                activeView === "visits" ? "text-white" : "text-emerald-500"
              }
              aria-hidden
            />
            Revisión de visitas
          </Link>
          ) : null}
          <Link
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${activeView === "reports"
              ? "bg-emerald-900 text-white"
              : "text-emerald-900 hover:bg-emerald-50"
              }`}
            href="/dashboard/reporte-extensionista"
          >
            <FiUsers
              className={
                activeView === "reports" ? "text-white" : "text-emerald-500"
              }
              aria-hidden
            />
            Reporte de extensionista
          </Link>
        </nav>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Slide-out menu */}
          <aside className="fixed left-0 top-0 h-full w-64 bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
                  Navegación
                </p>
                <h2 className="text-lg font-semibold text-emerald-900">
                  Panel principal
                </h2>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md p-2 text-emerald-600 hover:bg-emerald-50"
                type="button"
              >
                <FiX size={20} />
              </button>
            </div>
            <nav className="space-y-2">
              <Link
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${activeView === "stats"
                  ? "bg-emerald-900 text-white"
                  : "text-emerald-900 hover:bg-emerald-50"
                  }`}
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FiBarChart2
                  className={activeView === "stats" ? "text-white" : "text-emerald-500"}
                  aria-hidden
                />
                Estadística
              </Link>
              {!isRestricted ? (
                <Link
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${activeView === "visits"
                    ? "bg-emerald-900 text-white"
                    : "text-emerald-900 hover:bg-emerald-50"
                    }`}
                href="/dashboard/visitas"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FiActivity
                  className={
                    activeView === "visits" ? "text-white" : "text-emerald-500"
                  }
                  aria-hidden
                />
                Revisión de visitas
              </Link>
            ) : null}
              <Link
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${activeView === "reports"
                  ? "bg-emerald-900 text-white"
                  : "text-emerald-900 hover:bg-emerald-50"
                  }`}
                href="/dashboard/reporte-extensionista"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FiUsers
                  className={
                    activeView === "reports" ? "text-white" : "text-emerald-500"
                  }
                  aria-hidden
                />
                Reporte de extensionista
              </Link>
            </nav>
          </aside>
        </div>
      )}

      <main className="flex-1 px-3 py-4 md:px-4 md:py-8 overflow-x-hidden lg:ml-64">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 md:gap-6 overflow-hidden">
          <header className="rounded-2xl md:rounded-3xl bg-linear-to-br from-emerald-900 to-emerald-800 p-4 md:p-8 text-white shadow-xl">
            <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                {/* Hamburger menu button - mobile only */}
                <button
                  className="mt-1 rounded-md bg-white/10 p-2 lg:hidden"
                  onClick={() => setMobileMenuOpen(true)}
                  type="button"
                  aria-label="Abrir menú"
                >
                  <FiMenu size={20} />
                </button>
                <div>
                  <p className="text-xs md:text-sm uppercase tracking-[0.15em] md:tracking-[0.2em] text-emerald-300">
                    Flujo administrativo
                  </p>
                  <h1 className="mt-2 md:mt-4 text-xl md:text-3xl font-semibold leading-tight">
                    {activeView === "stats"
                      ? "Resumen estadístico de encuestas"
                      : activeView === "visits"
                        ? "Revisión de visitas"
                        : "Reporte de extensionista"}
                  </h1>
                  <p className="mt-2 md:mt-3 text-sm md:text-base text-emerald-200">
                    {activeView === "stats"
                      ? "Explora totales, cobertura y top extensionistas."
                      : activeView === "visits"
                        ? "Busca extensionistas registrados y revisa sus visitas por productor."
                        : "Consulta el resumen de extensionistas y sus visitas."}
                  </p>
                </div>
              </div>
            </div>
          </header>

          {activeView === "stats" ? (
            <section
              className={`${SECTION_CLASS} bg-linear-to-b from-white to-emerald-50/50`}
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
                <SkeletonStatsGrid count={6} />
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
                    <div className="mt-3">
                      <GeneralSummaryChart
                        totals={totals ?? {
                          survey_1: 0,
                          survey_2: 0,
                          survey_3: 0,
                          all_types: 0,
                        }}
                        propertiesTotals={propertiesTotals ?? {
                          magdalena: 0,
                          atlantico: 0,
                          total_magdalena_atlantico: 0,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="md:col-span-2 xl:col-span-2 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-emerald-900">
                        Visitas por departamento
                      </p>
                      <p className="text-xs text-emerald-500">
                        Totales de visitas 1, 2 y 3 por departamento
                      </p>
                      {departmentRows.length > 0 ? (
                        <div className="mt-3 overflow-x-auto -mx-4 md:mx-0">
                          <table className="min-w-full divide-y divide-emerald-100 text-sm">
                            <thead className="bg-emerald-50/80">
                              <tr className="text-left text-emerald-600">
                                <th className="px-2 md:px-3 py-2 font-semibold">Depto.</th>
                                <th className="px-2 py-2 text-center font-semibold">V1</th>
                                <th className="px-2 py-2 text-center font-semibold">V2</th>
                                <th className="px-2 py-2 text-center font-semibold">V3</th>
                                <th className="px-2 py-2 text-center font-semibold">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-50">
                              {departmentRows.map((row) => (
                                <tr key={row.state}>
                                  <td className="px-2 md:px-3 py-2 font-semibold text-emerald-900 text-xs md:text-sm">
                                    {row.state}
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    <span className="inline-block min-w-8 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                      {row.survey_1}
                                    </span>
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    <span className="inline-block min-w-8 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                      {row.survey_2}
                                    </span>
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    <span className="inline-block min-w-8 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                      {row.survey_3}
                                    </span>
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    <span className="inline-block min-w-8 rounded-full bg-emerald-900 px-2 py-0.5 text-xs font-semibold text-white">
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
                        {statsLoading ? (
                          <SkeletonChart />
                        ) : topCities.length > 0 ? (
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
                                    ? (stateCountsRaw as StateCountEntry[]).reduce<Record<string, number>>(
                                      (acc, item) => {
                                        if (item?.value) {
                                          acc[item.value] = item.count ?? 0;
                                        }
                                        return acc;
                                      },
                                      {},
                                    )
                                    : stateCountsRaw ?? {};
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
                                      const bucket = prop[key];
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
                description="Resumen de visitas por extensionista."
              />
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-xs font-semibold text-emerald-800">
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 ring-1 ring-inset ring-amber-600/20">
                  <svg className="h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                  Pendiente
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 ring-1 ring-inset ring-emerald-600/20">
                  <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                  Aceptada
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 ring-1 ring-inset ring-red-600/20">
                  <svg className="h-3 w-3 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                  Rechazada
                </span>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="grid flex-1 gap-3 md:grid-cols-2">
                  <label className="text-sm font-semibold text-emerald-700">
                    Nombre
                    <input
                      className="mt-1 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      placeholder="Nombre del extensionista"
                      value={reportNameFilter}
                      onChange={(e) => {
                        setReportNameFilter(e.target.value);
                        setReportPage(1);
                      }}
                    />
                  </label>
                  <label className="text-sm font-semibold text-emerald-700">
                    Correo
                    <input
                      className="mt-1 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      placeholder="Correo del extensionista"
                      value={reportEmailFilter}
                      onChange={(e) => {
                        setReportEmailFilter(e.target.value);
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
                    setReportNameFilter("");
                    setReportEmailFilter("");
                    setReportPage(1);
                    refetchExtensionists();
                  }}
                >
                  Limpiar filtros de reporte
                </button>
                <button
                  type="button"
                  className="rounded-md border border-emerald-200 px-3 py-1 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900"
                  onClick={() => {
                    refetchExtensionists();
                  }}
                >
                  Actualizar
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
                      <div className="mt-2 flex items-center gap-1.5">
                        {(bucket?.pending ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20" title="Pendientes">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                            {bucket?.pending ?? 0}
                          </span>
                        )}
                        {(bucket?.accepted ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20" title="Aceptadas">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                            {bucket?.accepted ?? 0}
                          </span>
                        )}
                        {(bucket?.rejected ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20" title="Rechazadas">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            {bucket?.rejected ?? 0}
                          </span>
                        )}
                        {total === 0 && <span className="text-xs text-slate-400 italic">Sin visitas</span>}
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
                  {selectedExtensionist && summaryData?.extensionist ? (
                    <div className="mt-4 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-emerald-900">
                        Datos del extensionista seleccionado
                      </p>
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                          <p className="text-xs uppercase tracking-[0.08em] text-emerald-600">
                            Nombre
                          </p>
                          <p className="text-sm font-semibold text-emerald-900">
                            {summaryExtensionist?.name ?? "N/D"}
                          </p>
                          <p className="text-xs text-emerald-500">
                            {summaryExtensionist?.identification ?? "N/D"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-emerald-100 bg-white p-3 shadow-sm">
                          <p className="text-xs uppercase tracking-[0.08em] text-emerald-600">
                            Contacto
                          </p>
                          <p className="text-sm font-semibold text-emerald-900">
                            {summaryExtensionist?.email ?? "N/D"}
                          </p>
                          <p className="text-xs text-emerald-500">
                            {summaryExtensionist?.phone ?? "N/D"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-emerald-100 bg-white p-3 shadow-sm">
                          <p className="text-xs uppercase tracking-[0.08em] text-emerald-600">
                            Ubicación
                          </p>
                          <p className="text-sm font-semibold text-emerald-900">
                            {summaryExtensionist?.city ?? "Ciudad N/D"}
                          </p>
                          <p className="text-xs text-emerald-500">
                            Zona: {summaryExtensionist?.zone ?? "N/D"}
                          </p>
                        </div>
                      </div>
                      {summaryData.states_summary ? (
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          {(["survey_1", "survey_2", "survey_3"] as const).map((key, idx) => {
                            const bucket =
                              summaryData.states_summary?.[key] ??
                              ({} as SurveysStateSummaryBucket);
                            const total =
                              (bucket.pending ?? 0) +
                              (bucket.accepted ?? 0) +
                              (bucket.rejected ?? 0);
                            return (
                              <div
                                key={key}
                                className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3"
                              >
                                <p className="text-xs uppercase tracking-[0.08em] text-emerald-600">
                                  Visita {idx + 1}
                                </p>
                                <p className="text-lg font-semibold text-emerald-900">{total}</p>
                                <div className="mt-2 flex items-center gap-1.5">
                                  {(bucket.pending ?? 0) > 0 && (
                                    <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20" title="Pendientes">
                                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                      {bucket.pending ?? 0}
                                    </span>
                                  )}
                                  {(bucket.accepted ?? 0) > 0 && (
                                    <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20" title="Aceptadas">
                                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                      {bucket.accepted ?? 0}
                                    </span>
                                  )}
                                  {(bucket.rejected ?? 0) > 0 && (
                                    <span className="inline-flex items-center gap-0.5 rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20" title="Rechazadas">
                                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                      {bucket.rejected ?? 0}
                                    </span>
                                  )}
                                  {total === 0 && <span className="text-xs text-slate-400 italic">Sin visitas</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {selectedExtensionist ? (
                    <div className="mt-4 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-emerald-900">
                            Productores atendidos por {selectedExtensionist.name}
                          </p>
                          <p className="text-xs text-emerald-500">
                            Estados por visita y PDF generado por tipo.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {producersLoading || producersFetching ? (
                            <p className="text-xs text-emerald-600">Cargando productores...</p>
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
                              } catch (error: unknown) {
                                const message = getErrorMessage(
                                  error,
                                  "No fue posible descargar el Excel.",
                                );
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
                      {producersError ? (
                        <p className="mt-2 text-sm text-red-600">
                          {producersFetchError?.message ?? "No fue posible cargar los productores."}
                        </p>
                      ) : producers.length > 0 ? (
                        <div className="mt-3 space-y-3">
                          {producers.map((producer) => {
                            const isExpanded = reportExpandedProducerId === producer.id;
                            return (
                              <div
                                key={producer.id}
                                className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3"
                              >
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-emerald-900">
                                      {producer.name}
                                    </p>
                                    <p className="text-xs text-emerald-600">
                                      {producer.identification ?? "Sin identificación"} ·{" "}
                                      {producer.phone ?? "Sin teléfono"}
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
                                            producer.surveysStateSummary?.[key],
                                          )}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {producer.properties?.length ? (
                                    <span className="rounded-md bg-white px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                      Predios:{" "}
                                      {producer.properties.map((prop) => prop.name).join(", ")}
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-emerald-500">
                                      Sin predios registrados
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900"
                                    onClick={() =>
                                      setReportExpandedProducerId(
                                        isExpanded ? null : producer.id,
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
                                  <div className="mt-3 grid gap-2 rounded-lg border border-emerald-100 bg-white p-3 text-sm text-emerald-800 md:grid-cols-3">
                                    {(["type_1", "type_2", "type_3"] as const).map((key, idx) => {
                                      const visit = producer.surveySummary?.[key] as
                                        | SurveySummaryEntry
                                        | undefined;
                                      const surveyKey = `survey_${idx + 1}` as keyof SurveysStateSummary;
                                      const bucket = producer.surveysStateSummary?.[surveyKey];
                                      const stateCounts = summarizeStatesArray(visit?.states);
                                      return (
                                        <div
                                          key={key}
                                          className="rounded-md border border-emerald-100 bg-emerald-50/70 p-2 text-xs"
                                        >
                                          <p className="font-semibold text-emerald-900">
                                            Visita {idx + 1}
                                          </p>
                                          <p className="text-emerald-700">
                                            Cantidad: {visit?.count ?? bucket?.count ?? 0}
                                          </p>
                                          <p className="text-emerald-700">
                                            Última:{" "}
                                            {visit?.latest_visit
                                              ? formatDate(visit.latest_visit as string)
                                              : "N/D"}
                                          </p>
                                          {visit?.file_pdf ? (
                                            <a
                                              className="font-semibold text-emerald-700 hover:text-emerald-900"
                                              href={normalizeMediaUrl(visit.file_pdf as string)}
                                              target="_blank"
                                              rel="noreferrer"
                                            >
                                              Ver PDF
                                            </a>
                                          ) : (
                                            <p className="text-emerald-500">Sin PDF</p>
                                          )}
                                          {Object.keys(stateCounts).length > 0 ? (
                                            <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-emerald-800">
                                              {Object.entries(stateCounts).map(([state, count]) => (
                                                <span
                                                  key={state}
                                                  className="rounded-full bg-white px-2 py-1 font-semibold ring-1 ring-emerald-100"
                                                >
                                                  {state}: {count}
                                                </span>
                                              ))}
                                            </div>
                                          ) : null}
                                        </div>
                                      );
                                    })}
                                    {producer.properties?.length ? (
                                      <div className="md:col-span-3">
                                        <p className="text-xs uppercase tracking-[0.08em] text-emerald-600">
                                          Predios asociados
                                        </p>
                                        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                          {producer.properties.map((property) => (
                                            <div
                                              key={property.id}
                                              className="rounded-md border border-emerald-100 bg-emerald-50/70 p-2 text-xs"
                                            >
                                              <p className="font-semibold text-emerald-900">
                                                {property.name ?? "Predio sin nombre"}
                                              </p>
                                              <p className="text-emerald-700">
                                                {property.city ?? "Ciudad N/D"} ·{" "}
                                                {property.state ?? "Depto N/D"}
                                              </p>
                                              {property.village ? (
                                                <p className="text-emerald-600">
                                                  Vereda: {property.village}
                                                </p>
                                              ) : null}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-emerald-500">
                          Este extensionista no tiene productores asociados.
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
                    className="w-full rounded-md border border-emerald-200 px-3 py-3 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="Nombre"
                    value={nameInput}
                    onChange={(event) => setNameInput(event.target.value)}
                  />
                  <input
                    className="w-full rounded-md border border-emerald-200 px-3 py-3 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="Correo"
                    value={emailInput}
                    onChange={(event) => setEmailInput(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      className="flex flex-1 items-center justify-center gap-2 rounded-md bg-emerald-900 px-3 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                      type="submit"
                      disabled={!accessToken}
                    >
                      <FiSearch aria-hidden />
                      Buscar
                    </button>
                    <button
                      className="flex items-center rounded-md border border-emerald-200 px-3 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900"
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
                          cityOverride: e.target.value,
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
                          zoneOverride: e.target.value,
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

                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-xs font-semibold text-emerald-800">
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 ring-1 ring-inset ring-amber-600/20">
                    <svg className="h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                    Pendiente
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 ring-1 ring-inset ring-emerald-600/20">
                    <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                    Aceptada
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 ring-1 ring-inset ring-red-600/20">
                    <svg className="h-3 w-3 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                    Rechazada
                  </span>
                </div>

                {extensionistsLoading ? (
                  <SkeletonTable rows={5} columns={9} />
                ) : extensionists.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-emerald-100 shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-emerald-100 text-sm">
                        <thead className="bg-emerald-50/80">
                          <tr className="text-left text-emerald-500">
                            <th className="px-3 pb-3 pt-2 font-medium">Nombre</th>
                            <th className="px-3 pb-3 pt-2 font-medium">Correo</th>
                            <th className="px-3 pb-3 pt-2 font-medium">Teléfono</th>
                            <th className="px-3 pb-3 pt-2 font-medium">Ciudad</th>
                            <th className="px-2 pb-3 pt-2 text-center font-medium">V1</th>
                            <th className="px-2 pb-3 pt-2 text-center font-medium">V2</th>
                            <th className="px-2 pb-3 pt-2 text-center font-medium">V3</th>
                            <th className="px-3 pb-3 pt-2 font-medium">Registrado</th>
                            <th className="px-2 pb-3 pt-2 font-medium"></th>
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
                                <td className="px-3 py-2 font-semibold text-emerald-900">
                                  {extensionist.name}
                                </td>
                                <td className="px-3 py-2 text-emerald-600">
                                  {extensionist.email ?? "—"}
                                </td>
                                <td className="px-3 py-2 text-emerald-600">
                                  {extensionist.phone}
                                </td>
                                <td className="px-3 py-2 text-emerald-600">
                                  {extensionist.city ?? "—"}
                                </td>
                                <td className="px-2 py-2 text-center">
                                  {renderVisitStates(extensionist, "survey_1")}
                                </td>
                                <td className="px-2 py-2 text-center">
                                  {renderVisitStates(extensionist, "survey_2")}
                                </td>
                                <td className="px-2 py-2 text-center">
                                  {renderVisitStates(extensionist, "survey_3")}
                                </td>
                                <td className="px-3 py-2 text-emerald-600">
                                  {registeredAt}
                                </td>
                                <td className="px-2 py-2 text-right">
                                  <button
                                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold transition ${isActive
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

              <section ref={propertiesSectionRef} className={SECTION_CLASS}>
                <SectionHeader
                  icon={<FiHome aria-hidden />}
                  title="Revisión de visitas del extensionista"
                  description="Productores atendidos y sus visitas registradas."
                />

                {!selectedExtensionist ? (
                  <p className="text-sm text-emerald-500">
                    Selecciona un extensionista para ver sus visitas.
                  </p>
                ) : producersLoading ? (
                  <>
                    <SkeletonPropertiesSummary />
                    <div className="mt-4">
                      <SkeletonPropertiesList count={4} />
                    </div>
                  </>
                ) : producers.length > 0 ? (
                  <>
                    {producersSummary ? (
                      <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                        <p className="text-sm font-semibold text-emerald-900">
                          Resumen de visitas en productores
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-600">
                          <span className="inline-flex items-center gap-1">
                            <svg className="h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                            Pendientes
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                            Aceptadas
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <svg className="h-3 w-3 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            Rechazadas
                          </span>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          {(["survey_1", "survey_2", "survey_3"] as const).map(
                            (key, idx) => {
                              const bucket = producersSummary?.[key];
                              return (
                                <div
                                  key={key}
                                  className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3"
                                >
                                  <p className="text-xs uppercase tracking-widest text-emerald-600">
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
                                  <div className="mt-2 flex items-center gap-1.5">
                                    {(bucket?.pending ?? 0) > 0 && (
                                      <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20" title="Pendientes">
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                        {bucket?.pending ?? 0}
                                      </span>
                                    )}
                                    {(bucket?.accepted ?? 0) > 0 && (
                                      <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20" title="Aceptadas">
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                        {bucket?.accepted ?? 0}
                                      </span>
                                    )}
                                    {(bucket?.rejected ?? 0) > 0 && (
                                      <span className="inline-flex items-center gap-0.5 rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20" title="Rechazadas">
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                        {bucket?.rejected ?? 0}
                                      </span>
                                    )}
                                    {((bucket?.pending ?? 0) + (bucket?.accepted ?? 0) + (bucket?.rejected ?? 0)) === 0 && <span className="text-xs text-slate-400 italic">Sin visitas</span>}
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
                        placeholder="Buscar por nombre, cédula o teléfono"
                        value={producerSearch}
                        onChange={(e) => {
                          setProducerSearch(e.target.value);
                          setProducerPage(1);
                        }}
                      />
                      <div className="flex items-center gap-2 text-xs text-emerald-600">
                        <span>
                          Productores:{" "}
                          <strong className="text-emerald-900">
                            {filteredProducers.length}
                          </strong>
                        </span>
                        <span className="hidden md:inline-block">·</span>
                        <span>
                          Página {currentProducerPageSafe} de {producersTotalPages}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {paginatedProducers.map((producer) => {
                        const isExpanded = expandedProducerId === producer.id;
                        const defaultProperty = producer.properties?.[0];
                        const normalizedProperty = mapProducerPropertyToProperty(defaultProperty);
                        const primaryPropertyLabel = normalizedProperty
                          ? `${normalizedProperty.name ?? "Predio sin nombre"} · ${normalizedProperty.city ?? "Ciudad N/D"}`
                          : "Sin predio asociado";
                        return (
                          <div
                            className="rounded-xl border border-emerald-100 bg-white shadow-sm"
                            key={producer.id}
                          >
                            <div
                              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                              onClick={() =>
                                setExpandedProducerId(
                                  isExpanded ? null : producer.id,
                                )
                              }
                              role="button"
                              tabIndex={0}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  setExpandedProducerId(
                                    isExpanded ? null : producer.id,
                                  );
                                }
                              }}
                            >
                              <div>
                                <p className="text-base font-semibold text-emerald-900">
                                  {producer.name}
                                </p>
                                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-emerald-600">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-800 ring-1 ring-emerald-100">
                                    Propiedad: {normalizedProperty?.name ?? "Sin predio asociado"}
                                  </span>
                                  {normalizedProperty?.state ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                      Depto: {normalizedProperty.state}
                                    </span>
                                  ) : null}
                                  {normalizedProperty?.city ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                      Municipio: {normalizedProperty.city}
                                    </span>
                                  ) : null}
                                  {normalizedProperty?.village ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                      Vereda: {normalizedProperty.village}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                    ID: {producer.identification ?? "N/D"}
                                  </span>
                                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                    Tel: {producer.phone ?? "N/D"}
                                  </span>
                                </div>
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
                                            producer.surveysStateSummary?.[key],
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
                                    const mappedProperty = mapProducerPropertyToProperty(defaultProperty);
                                    setSelectedProducer(producer);
                                    setSelectedProperty(mappedProperty);
                                    setSelectedVisit(1);
                                    setVisitDecision(null);
                                    setShowClassificationDetail(false);
                                    setEditableVisit(null);
                                    setEditableProducer(null);
                                    setEditableProperty(null);
                                    setApprovalProfile("");
                                    setSelectedProfileName("");
                                    setDecisionReason("");
                                    setDecisionError(null);
                                    setUpdateMessage(null);
                                    setUpdateError(null);
                                    setUpdateFiles({});
                                    setExpandedProducerId(producer.id);
                                    // Scroll to surveys section after a short delay
                                    setTimeout(() => {
                                      propertySurveysSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                                    }, 100);
                                  }}
                                >
                                  Ver visitas
                                </button>
                                <span
                                  className={`rounded-full border border-emerald-200 p-2 text-emerald-600 transition ${isExpanded ? "bg-emerald-50 rotate-90" : ""
                                    }`}
                                >
                                  <FiChevronRight aria-hidden />
                                </span>
                              </div>
                            </div>

                            {isExpanded ? (
                              <div className="grid gap-3 border-t border-emerald-100 px-4 py-3 md:grid-cols-3">
                                {(["type_1", "type_2", "type_3"] as const).map((key, idx) => {
                                  const visit = producer.surveySummary?.[key] as
                                    | SurveySummaryEntry
                                    | undefined;
                                  const surveyKey = `survey_${idx + 1}` as keyof SurveysStateSummary;
                                  const bucket = producer.surveysStateSummary?.[surveyKey];
                                  const stateCounts = summarizeStatesArray(visit?.states);
                                  return (
                                    <div
                                      key={key}
                                      className="rounded-lg bg-emerald-50 p-3 text-sm"
                                    >
                                      <p className="text-xs uppercase tracking-widest text-emerald-500">
                                        Visita {idx + 1}
                                      </p>
                                      <p className="text-sm font-semibold text-emerald-900">
                                        Cantidad: {visit?.count ?? bucket?.count ?? 0}
                                      </p>
                                      <p className="text-xs text-emerald-600">
                                        Última:{" "}
                                        {visit?.latest_visit
                                          ? formatDate(visit.latest_visit as string)
                                          : "N/D"}
                                      </p>
                                      {visit?.file_pdf ? (
                                        <a
                                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                                          href={normalizeMediaUrl(visit.file_pdf as string)}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          Ver PDF
                                        </a>
                                      ) : (
                                        <p className="text-xs text-emerald-500">Sin PDF</p>
                                      )}
                                      {Object.keys(stateCounts).length > 0 ? (
                                        <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-emerald-800">
                                          {Object.entries(stateCounts).map(([state, count]) => (
                                            <span
                                              key={state}
                                              className="rounded-full bg-white px-2 py-1 font-semibold ring-1 ring-emerald-100"
                                            >
                                              {state}: {count}
                                            </span>
                                          ))}
                                        </div>
                                      ) : null}
                                    </div>
                                  );
                                })}
                                {producer.properties?.length ? (
                                  <div className="md:col-span-3">
                                    <p className="text-xs uppercase tracking-widest text-emerald-500">
                                      Predios del productor
                                    </p>
                                    <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                      {producer.properties.map((property) => (
                                        <div
                                          key={property.id}
                                          className="rounded-md border border-emerald-100 bg-white p-3 text-sm"
                                        >
                                          <p className="font-semibold text-emerald-900">
                                            {property.name ?? "Predio sin nombre"}
                                          </p>
                                          <p className="text-xs text-emerald-600">
                                            {property.city ?? "Ciudad N/D"} ·{" "}
                                            {property.state ?? "Estado N/D"}
                                          </p>
                                          {property.village ? (
                                            <p className="text-xs text-emerald-600">
                                              Vereda: {property.village}
                                            </p>
                                          ) : null}
                                          <button
                                            className="mt-2 inline-flex items-center gap-1 rounded-md border border-emerald-200 px-2 py-1 text-[11px] font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900"
                                            type="button"
                                            onClick={() => {
                                              setSelectedProducer(producer);
                                              setSelectedProperty(mapProducerPropertyToProperty(property));
                                              setSelectedVisit(1);
                                              setVisitDecision(null);
                                              setShowClassificationDetail(false);
                                              setEditableVisit(null);
                                              setEditableProducer(null);
                                              setEditableProperty(null);
                                              setApprovalProfile("");
                                              setSelectedProfileName("");
                                              setDecisionReason("");
                                              setDecisionError(null);
                                              setUpdateMessage(null);
                                              setUpdateError(null);
                                              setUpdateFiles({});
                                              setTimeout(() => {
                                                propertySurveysSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                                              }, 100);
                                            }}
                                          >
                                            Abrir visitas
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <span className="text-xs text-emerald-600">
                        Mostrando {paginatedProducers.length} de {filteredProducers.length} productores
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                          type="button"
                          disabled={currentProducerPageSafe === 1}
                          onClick={() =>
                            setProducerPage((prev) => Math.max(1, prev - 1))
                          }
                        >
                          <FiChevronLeft aria-hidden />
                          Anterior
                        </button>
                        <span className="text-xs text-emerald-600">
                          Página {currentProducerPageSafe} de {producersTotalPages}
                        </span>
                        <button
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                          type="button"
                          disabled={currentProducerPageSafe === producersTotalPages}
                          onClick={() =>
                            setProducerPage((prev) =>
                              Math.min(producersTotalPages, prev + 1),
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
                    isLoading: producersLoading,
                    isFetching: producersFetching,
                    isError: producersError,
                    errorMessage: producersFetchError?.message,
                    emptyLabel:
                      "Selecciona un extensionista para mostrar sus productores.",
                  })
                )}
              </section>

              <section ref={propertySurveysSectionRef} className={SECTION_CLASS}>
                <SectionHeader
                  icon={<FiUsers aria-hidden />}
                  title="Visitas del productor"
                  description="Selecciona un productor para revisar sus visitas."
                />

                {!selectedProducer ? (
                  <p className="text-sm text-emerald-500">
                    Selecciona un productor para ver las visitas disponibles.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">
                          Productor seleccionado
                        </p>
                        <p className="text-lg font-semibold text-emerald-900">
                          {selectedProducer.name}
                        </p>
                        <p className="text-sm text-emerald-600">
                          ID: {selectedProducer.identification ?? "N/D"} · Tel:{" "}
                          {selectedProducer.phone ?? "N/D"}
                        </p>
                        {selectedProperty ? (
                          <p className="text-xs text-emerald-500">
                            Predio principal: {selectedProperty.name} ·{" "}
                            {selectedProperty.city ?? selectedProperty.municipality ?? "Ciudad N/D"}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300"
                          type="button"
                          onClick={() => refetchSurveyVisit()}
                          disabled={surveyVisitLoading || surveyVisitFetching}
                        >
                          <FiRefreshCcw aria-hidden />
                          {surveyVisitLoading || surveyVisitFetching ? "Recargando..." : "Recargar visita"}
                        </button>
                        {[1, 2, 3].map((num) => {
                          const isActive = selectedVisit === num;
                          return (
                            <button
                              key={num}
                              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${isActive
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
      setSelectedProfileName("");
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
                            disabled={
                              isDecisionReadOnly ||
                              !approvalProfile.trim() ||
                              decisionLoading ||
                              !visitDetail?.id
                            }
                            title={
                              isDecisionReadOnly
                                ? "Tu rol no permite esta acción"
                                : approvalProfile.trim()
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
                            disabled={isDecisionReadOnly || decisionLoading || !visitDetail?.id}
                          >
                            <FiX aria-hidden />
                            Rechazar
                          </button>
                          {visitDetail?.file_pdf ? (
                            <a
                              className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300"
                              href={normalizeMediaUrl(visitDetail.file_pdf as string)}
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
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${visitDecision === "accepted"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-700"
                                }`}
                            >
                              {visitDecision === "accepted"
                                ? "Marcado como aceptado (solo UI)"
                                : "Marcado como rechazado (solo UI)"}
                            </span>
                          ) : null}
                          {isDecisionReadOnly ? (
                            <span className="rounded-md bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                              Rol revisor_editor: no puede aceptar/rechazar
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
                          <div className="flex w-full flex-col gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 md:max-w-2xl">
                            <p className="text-xs font-semibold text-emerald-700">
                              Perfil (elige de la lista o escribe manual)
                            </p>
                            <div className="grid gap-2 md:grid-cols-2">
                              <FieldInput
                                label="Elegir por nombre"
                                type="select"
                                options={["", ...NAME_OPTIONS]}
                                value={selectedProfileName}
                                onChange={(v) => {
                                  setSelectedProfileName(v);
                                  const profile = NAME_TO_PROFILE[v];
                                  setApprovalProfile(profile ?? "");
                                }}
                              />
                              <FieldInput
                                label="Elegir por perfil"
                                type="select"
                                options={["", ...UNIQUE_PROFILE_OPTIONS]}
                                value={
                                  UNIQUE_PROFILE_OPTIONS.includes(approvalProfile)
                                    ? approvalProfile
                                    : ""
                                }
                                onChange={(v) => setApprovalProfile(v)}
                              />
                            </div>
                            <FieldInput
                              label="Perfil final"
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
                            <div className="rounded-2xl bg-linear-to-br from-emerald-900 to-emerald-800 p-5 text-white shadow-sm">
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
                                    Coordenadas: {editableProperty?.latitude ?? "N/D"},{" "}
                                    {editableProperty?.longitude ?? "N/D"}
                                  </span>
                                  <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white ring-1 ring-white/20">
                                    Registro:{" "}
                                    {formatVisitStamp(
                                      (editableVisit as any)?.date_hour_end ??
                                        (editableVisit as any)?.visit_date,
                                    ) ?? "Sin fecha en la visita"}
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
                                      visitDetail?.created_at,
                                      (editableVisit?.hour_acompanamiento as string) ??
                                      visitDetail?.hour_acompanamiento,
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
                                  value={editableProducer?.name ?? ""}
                                  onChange={(v) => updateProducerField("name", v)}
                                  placeholder="Ej: Juan Carlos Pérez Gómez"
                                />
                                <FieldInput
                                  label="Tipo de Documento"
                                  type="select"
                                  options={["CC", "TI", "CE", "NIT"]}
                                  value={editableProducer?.type_id ?? ""}
                                  onChange={(v) => updateProducerField("type_id", v)}
                                />
                                <FieldInput
                                  label="Número de Identificacion"
                                  value={editableProducer?.identification ?? ""}
                                  onChange={(v) => updateProducerField("identification", v)}
                                  placeholder="Ej: 1234567890"
                                />
                                <FieldInput
                                  label="Número Telefonico"
                                  value={editableProducer?.number_phone ?? ""}
                                  onChange={(v) => updateProducerField("number_phone", v)}
                                  placeholder="Ej: 3001234567"
                                />
                              </div>
                            </SectionCard>

                            <SectionCard number="2." title="Identificación del Predio">
                              <div className="grid gap-2 lg:grid-cols-3">
                                <FieldInput
                                  label="Nombre del Predio"
                                  value={editableProperty?.name ?? ""}
                                  onChange={(v) => updatePropertyField("name", v)}
                                  placeholder="Ej: Finca La Esperanza"
                                />
                                <FieldInput
                                  label="Coordenadas Geográficas"
                                  value={[
                                    editableProperty?.latitude ?? "",
                                    editableProperty?.longitude ?? "",
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                  readOnly
                                  placeholder="Ej: 10.188612074, -74.065231283"
                                />
                                <FieldInput
                                  label="ASNM"
                                  value={editableProperty?.asnm ?? ""}
                                  onChange={(v) => updatePropertyField("asnm", v)}
                                  placeholder="Ej: 0"
                                />
                                <FieldInput
                                  label="Departamento"
                                  type="select"
                                  options={departmentOptions}
                                  value={matchedDepartment ?? editableProperty?.state ?? ""}
                                  onChange={(v) => {
                                    updatePropertyField("state", v);
                                    // Reset municipio if cambia el depto
                                    updatePropertyField("city", "");
                                    updatePropertyField("municipality", "");
                                  }}
                                />
                                <FieldInput
                                  label="Municipio"
                                  type="select"
                                  options={availableMunicipalities}
                                  value={editableProperty?.city ?? editableProperty?.municipality ?? ""}
                                  onChange={(v) => {
                                    updatePropertyField("city", v);
                                    updatePropertyField("municipality", v);
                                  }}
                                />
                                <FieldInput
                                  label="Corregimiento/Vereda"
                                  value={editableProperty?.village ?? ""}
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
                                    editableProperty?.primaryLine ??
                                    editableProperty?.linea_productive_primary ??
                                    ""
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
                                    editableProperty?.secondaryLine ??
                                    editableProperty?.linea_productive_secondary ??
                                    ""
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
                                  editableProperty?.areaInProduction ??
                                  editableProperty?.area_in_production ??
                                  ""
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
                                          <p className="text-xs uppercase tracking-widest text-emerald-600">
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
                                          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${isActive
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
                                        <div
                                          className="cursor-pointer"
                                          onClick={() => setSelectedImageUrl(photo.url)}
                                        >
                                          <img
                                            src={photo.url}
                                            alt={photo.label}
                                            loading="eager"
                                            className="h-44 w-full object-cover transition hover:opacity-90"
                                            style={{ width: "100%", height: "176px" }}
                                          />
                                        </div>
                                        <div className="flex items-center justify-between px-3 py-2">
                                          <p className="text-sm font-semibold text-emerald-900">
                                            {photo.label}
                                          </p>
                                          <button
                                            type="button"
                                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                                            onClick={() => setSelectedImageUrl(photo.url)}
                                          >
                                            Ver grande
                                          </button>
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
                                    Puntaje: {(value as any)?.score ?? "N/D"}
                                    </span>
                                  </div>
                                  <FieldInput
                                    label="Observación"
                                    type="textarea"
                                  value={(value as any)?.obervation ?? ""}
                                  onChange={(v) => updateFocalizationObservation(key, v)}
                                  placeholder="Agregar observación"
                                  />
                                </div>
                              ))}
                            </div>
                          </SectionCard>
                      ) : null}

                            <SectionCard number="6." title="Datos del Acompañamiento">
                              <div className="grid gap-2 lg:grid-cols-3">
                                <FieldInput
                                  label="Origen registro"
                                  value="app_movil"
                                  readOnly
                                />
                            <FieldInput
                              label="Fecha de la visita"
                              value={
                                getDatePart(
                                  (editableVisit as any)?.date_hour_end ??
                                    (editableVisit as any)?.visit_date,
                                ) ?? ""
                              }
                              onChange={(v) => updateVisitDateTime(v, undefined)}
                              placeholder="AAAA-MM-DD"
                              type="date"
                            />
                            <FieldInput
                              label="Hora de la visita"
                              value={getTimePart(
                                (editableVisit as any)?.date_hour_end ??
                                  (editableVisit as any)?.visit_date,
                              )}
                              onChange={(v) => updateVisitDateTime(undefined, v)}
                              placeholder="HH:MM"
                              type="time"
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
                                          className={`flex min-h-12 items-center justify-center rounded-md px-3 py-2 text-center text-sm font-semibold transition ${isActive
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
                                  value={visitExtensionist?.name as string}
                                  readOnly
                                />
                                <FieldInput
                              label="Identificación Del Extensionista"
                              value={visitExtensionist?.identification as string}
                              readOnly
                            />
                                <div className="rounded-lg border border-emerald-50 bg-emerald-50/60 p-3">
                                  <p className="text-xs uppercase tracking-[0.08em] text-emerald-600">
                                    Firma extensionista
                                  </p>
                                  {visitExtensionist?.signing_image_path ? (
                                    <img
                                      src={visitExtensionist.signing_image_path}
                                      alt="Firma del extensionista"
                                      loading="eager"
                                      className="mt-2 h-20 w-full max-w-xs rounded-md border border-emerald-100 bg-white object-contain p-2"
                                      style={{ width: "100%", height: "80px" }}
                                    />
                                  ) : (
                                    <p className="text-sm font-semibold text-emerald-900">
                                      Sin firma adjunta
                                    </p>
                                  )}
                                </div>
                              </div>
                            </SectionCard>

                            {/* Duplicate action buttons at bottom for convenience */}
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 space-y-4">
                              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                                Acciones rápidas
                              </p>
                              <div className="grid gap-3 md:grid-cols-2">
                                <div className="flex flex-col gap-2 rounded-lg border border-emerald-100 bg-white p-3">
                                  <p className="text-xs font-semibold text-emerald-700">
                                    Perfil (elige de la lista o escribe manual)
                                  </p>
                                  <div className="grid gap-2 md:grid-cols-2">
                                    <FieldInput
                                      label="Elegir por nombre"
                                      type="select"
                                      options={["", ...NAME_OPTIONS]}
                                      value={selectedProfileName}
                                      onChange={(v) => {
                                        setSelectedProfileName(v);
                                        const profile = NAME_TO_PROFILE[v];
                                        setApprovalProfile(profile ?? "");
                                      }}
                                    />
                                    <FieldInput
                                      label="Elegir por perfil"
                                      type="select"
                                      options={["", ...UNIQUE_PROFILE_OPTIONS]}
                                      value={
                                        UNIQUE_PROFILE_OPTIONS.includes(approvalProfile)
                                          ? approvalProfile
                                          : ""
                                      }
                                      onChange={(v) => setApprovalProfile(v)}
                                    />
                                  </div>
                                  <FieldInput
                                    label="Perfil final"
                                    value={approvalProfile}
                                    onChange={(v) => setApprovalProfile(v)}
                                    placeholder="Ingresa el perfil antes de aceptar"
                                    highlight
                                  />
                                </div>
                                <div className="max-w-md">
                                  <FieldInput
                                    label="Motivo (opcional)"
                                    value={decisionReason}
                                    onChange={(v) => setDecisionReason(v)}
                                    placeholder="Ej: Documentos verificados"
                                  />
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-3">
                                <button
                                  className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
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
                              </div>
                            </div>
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

      {/* Image Modal */}
      <ImageModal
        isOpen={!!selectedImageUrl}
        onClose={() => setSelectedImageUrl(null)}
        src={selectedImageUrl ?? ""}
        alt="Foto ampliada"
      />
    </div>
  );
};
