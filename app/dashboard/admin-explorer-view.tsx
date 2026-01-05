"use client";

import {
  FormEvent,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "@/services/properties";
import { fetchSurveyStatistics } from "@/services/statistics";
import { ExtensionistChart } from "./charts/ExtensionistChart";
import { CityChart } from "./charts/CityChart";
import { ProductiveLineChart } from "./charts/ProductiveLineChart";

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

const FieldItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => (
  <div className="rounded-lg border border-emerald-50 bg-emerald-50/60 px-3 py-2">
    <p className="text-xs uppercase tracking-[0.08em] text-emerald-600">
      {label}
    </p>
    <p className="text-sm font-semibold text-emerald-900">
      {value ?? "Sin información"}
    </p>
  </div>
);

export const AdminExplorerView = () => {
  const { data: session } = useSession();
  const accessToken = (session as SessionWithToken | null)?.accessToken;
  const tokenType = (session as SessionWithToken | null)?.tokenType ?? "Token";
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
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
  const [activeView, setActiveView] = useState<"stats" | "visits">("stats");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedPropertyId, setExpandedPropertyId] = useState<number | null>(
    null,
  );
  const [propertySearch, setPropertySearch] = useState("");
  const [propertyPage, setPropertyPage] = useState(1);
  const { data: statsResponse, isLoading: statsLoading, isError: statsError } =
    useQuery({
      queryKey: ["survey-statistics", accessToken],
      queryFn: () => fetchSurveyStatistics(accessToken),
      enabled: Boolean(accessToken),
    });

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters({
      name: nameInput.trim() || undefined,
      email: emailInput.trim() || undefined,
    });
    setSelectedExtensionist(null);
    setSelectedProperty(null);
    setSelectedVisit(null);
    setVisitDecision(null);
    setShowClassificationDetail(false);
    setCurrentPage(1);
    setExpandedPropertyId(null);
    setPropertySearch("");
    setPropertyPage(1);
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
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(extensionists.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedExtensionists = extensionists.slice(
    (currentPageSafe - 1) * pageSize,
    currentPageSafe * pageSize,
  );
  const goToPage = (page: number) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(clamped);
  };

  const {
    data: propertiesResponse,
    isLoading: propertiesLoading,
    isError: propertiesError,
    error: propertiesFetchError,
    isFetching: propertiesFetching,
  } = useQuery({
    queryKey: [
      "extensionist-properties-full",
      selectedExtensionist?.id,
      accessToken,
      tokenType,
    ],
    queryFn: () =>
      fetchExtensionistProperties(selectedExtensionist!.id, accessToken, tokenType),
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

  const properties = propertiesResponse?.data ?? [];
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
  const statCards = [
    {
      label: "Encuestas iniciales",
      value: surveyStats?.surveys.total ?? 0,
      hint: "Formularios base",
      icon: <FiBarChart2 aria-hidden />,
    },
    {
      label: "Extensionistas únicos",
      value: surveyStats?.surveys.unique_extensionists ?? 0,
      hint: "Cobertura inicial",
      icon: <FiUsers aria-hidden />,
    },
    {
      label: "Productores únicos",
      value: surveyStats?.surveys.unique_producers ?? 0,
      hint: "Participantes distintos",
      icon: <FiHome aria-hidden />,
    },
    {
      label: "Predios únicos",
      value: surveyStats?.surveys.unique_properties ?? 0,
      hint: "Propiedades atendidas",
      icon: <FiMapPin aria-hidden />,
    },
    {
      label: "Total de todos los tipos",
      value: surveyStats?.totals.total_all_types ?? 0,
      hint: "Incluye seguimiento y finales",
      icon: <FiPieChart aria-hidden />,
    },
  ];
  const topExtensionists =
    surveyStats?.surveys.top_extensionists?.slice(0, 5) ?? [];
  const topCities = surveyStats?.surveys.cities?.counts.slice(0, 5) ?? [];
  const topPrimaryLines =
    surveyStats?.surveys.primary_productive_lines?.slice(0, 5) ?? [];

  const handleLogout = () => {
    window.localStorage.removeItem("access_token");
    signOut({ callbackUrl: "/login" });
  };

  const handleExtensionistSelect = (extensionist: Extensionist) => {
    setSelectedExtensionist(extensionist);
    setExpandedPropertyId(null);
    setSelectedProperty(null);
    setSelectedVisit(null);
    setVisitDecision(null);
    setShowClassificationDetail(false);
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

  const prettifyKey = (key: string) =>
    key
      .split("_")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ")
      .replace("Ict", "ICT");

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
  ).filter(
    (photo): photo is { label: string; url: string } => Boolean(photo.url),
  );
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
                    : "Revisión de extensionistas"}
                </h1>
                <p className="mt-3 text-base text-emerald-200">
                  {activeView === "stats"
                    ? "Explora totales, cobertura y top extensionistas."
                    : "Busca extensionistas registrados y revisa sus datos básicos."}
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

                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-emerald-900">
                        Top extensionistas
                      </p>
                      <p className="text-xs text-emerald-500">
                        Más encuestas realizadas
                      </p>
                      <div className="mt-3">
                        {topExtensionists.length > 0 ? (
                          <ExtensionistChart data={topExtensionists} />
                        ) : (
                          <p className="text-sm text-emerald-500">
                            Sin registros de extensionistas.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-emerald-900">
                        Ciudades con más encuestas
                      </p>
                      <p className="text-xs text-emerald-500">
                        Top 5 por volumen de registros
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

                    <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-emerald-900">
                        Líneas productivas principales
                      </p>
                      <p className="text-xs text-emerald-500">
                        Declaradas como actividad primaria
                      </p>
                      <div className="mt-3">
                        {topPrimaryLines.length > 0 ? (
                          <ProductiveLineChart data={topPrimaryLines} />
                        ) : (
                          <p className="text-sm text-emerald-500">
                            Sin registros de líneas productivas.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-emerald-500">
                  No hay datos estadísticos disponibles.
                </p>
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
                        setCurrentPage(1);
                        refetchExtensionists();
                      }}
                    >
                      Limpiar
                    </button>
                  </div>
                </form>

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
                          {Math.min(currentPageSafe * pageSize, extensionists.length)}
                        </strong>{" "}
                        de{" "}
                        <strong className="text-emerald-900">
                          {extensionists.length}
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
                          <button
                            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                            onClick={() =>
                              setExpandedPropertyId(
                                isExpanded ? null : property.id,
                              )
                            }
                            type="button"
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
                              <button
                              className="rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900"
                              type="button"
                              onClick={() => {
                                setSelectedProperty(property);
                                setSelectedVisit(1);
                                setVisitDecision(null);
                                setShowClassificationDetail(false);
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
                          </button>

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
                            className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                            type="button"
                            onClick={() => setVisitDecision("accepted")}
                          >
                            <FiCheck aria-hidden />
                            Aceptar
                          </button>
                          <button
                            className="inline-flex items-center gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:border-red-200"
                            type="button"
                            onClick={() => setVisitDecision("rejected")}
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
                                    Coordenadas: {(visitPropertyData as any)?.latitude ?? "N/D"},{" "}
                                    {(visitPropertyData as any)?.longitude ?? "N/D"}
                                  </span>
                                  <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white ring-1 ring-white/20">
                                    Objetivo: {visitDetail?.objetive_accompaniment ?? "Sin objetivo"}
                                  </span>
                                  <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white ring-1 ring-white/20">
                                    Registro:{" "}
                                    {visitDetail?.date_acompanamiento
                                      ? `${formatDate(visitDetail.date_acompanamiento)} ${visitDetail.hour_acompanamiento ?? ""}`.trim()
                                      : "Sin fecha"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <SectionCard
                              number="1."
                              title="Identificación Del Usuario Productor"
                            >
                              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                <FieldItem
                                  label="1.1 Nombre Completo Usuario Productor"
                                  value={(visitProducer as any)?.name}
                                />
                                <FieldItem
                                  label="1.2 Tipo de Documento"
                                  value={(visitProducer as any)?.type_id}
                                />
                                <FieldItem
                                  label="1.3 Número de Identificación"
                                  value={(visitProducer as any)?.identification}
                                />
                                <FieldItem
                                  label="1.4 Número Telefonico"
                                  value={(visitProducer as any)?.number_phone}
                                />
                              </div>
                            </SectionCard>

                            <SectionCard
                              number="2."
                              title="Identificación del Predio"
                            >
                              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                <FieldItem
                                  label="2.1 Nombre del Predio"
                                  value={visitPropertyData?.name}
                                />
                                <FieldItem
                                  label="2.2 ASNM"
                                  value={(visitPropertyData as any)?.asnm}
                                />
                                <FieldItem
                                  label="2.3 Departamento"
                                  value={(visitPropertyData as any)?.state}
                                />
                                <FieldItem
                                  label="2.4 Municipio"
                                  value={(visitPropertyData as any)?.city ?? (visitPropertyData as any)?.municipality}
                                />
                                <FieldItem
                                  label="2.5 Corregimiento/Vereda"
                                  value={(visitPropertyData as any)?.village}
                                />
                              </div>
                            </SectionCard>

                            <SectionCard
                              number="3."
                              title="Identificación Del Sistema Productivo"
                            >
                              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                <FieldItem
                                  label="3.1 Linea Productiva Principal"
                                  value={(visitPropertyData as any)?.primaryLine ?? (visitPropertyData as any)?.linea_productive_primary}
                                />
                                <FieldItem
                                  label="3.2 Linea Productiva Secundaria"
                                  value={(visitPropertyData as any)?.secondaryLine ?? (visitPropertyData as any)?.linea_productive_secondary}
                                />
                                <FieldItem
                                  label="3.3 Área total En Producción"
                                  value={
                                    ((visitPropertyData as any)?.areaInProduction ??
                                      (visitPropertyData as any)?.area_in_production) &&
                                    `${(visitPropertyData as any)?.areaInProduction ?? (visitPropertyData as any)?.area_in_production} ha`
                                  }
                                />
                              </div>
                            </SectionCard>

                            <SectionCard
                              number="4."
                              title="Clasificación Del Usuario (Según Ley 1876 Del 2017)"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm text-emerald-700">
                                    Nivel de clasificación del último diagnóstico.
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-emerald-900 px-3 py-1 text-xs font-semibold text-white">
                                    Total: {classificationTotal ?? "N/D"}
                                  </span>
                                  {classificationEntries.length > 0 ? (
                                    <button
                                      type="button"
                                      className="rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800 transition hover:border-emerald-300 hover:text-emerald-900"
                                      onClick={() =>
                                        setShowClassificationDetail((prev) => !prev)
                                      }
                                    >
                                      {showClassificationDetail ? "Ocultar detalle" : "Ver detalle"}
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                              {showClassificationDetail && classificationEntries.length > 0 ? (
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
                            </SectionCard>

                            <SectionCard
                              number="5."
                              title="Enfoque Técnico Productivo"
                            >
                              <div className="space-y-3">
                                <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                                  <p className="text-xs uppercase tracking-[0.1em] text-emerald-600">
                                    5.0 Enfoque Técnico Productivo
                                  </p>
                                  <p className="mt-2 text-sm text-emerald-900">
                                    {visitDetail?.objetive_accompaniment ?? "Sin información registrada."}
                                  </p>
                                </div>
                                <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                                  <p className="text-xs uppercase tracking-[0.1em] text-emerald-600">
                                    5.1 Diagnóstico visita
                                  </p>
                                  <p className="mt-2 text-sm text-emerald-900">
                                    {visitDetail?.initial_diagnosis ?? "Sin información registrada."}
                                  </p>
                                </div>
                                <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                                  <p className="text-xs uppercase tracking-[0.1em] text-emerald-600">
                                    5.2 Recomendaciones y Compromisos
                                  </p>
                                  <p className="mt-2 text-sm text-emerald-900">
                                    {visitDetail?.recommendations_commitments ??
                                      "Sin información registrada."}
                                  </p>
                                </div>
                                <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                                  <p className="text-xs uppercase tracking-[0.1em] text-emerald-600">
                                    5.3 Se Cumplió con las recomendaciones de la visita Anterior
                                  </p>
                                  <p className="mt-2 text-sm text-emerald-900">
                                    {"Sin información registrada."}
                                  </p>
                                </div>
                                <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                                  <p className="text-xs uppercase tracking-[0.1em] text-emerald-600">
                                    5.4 Observaciones visita
                                  </p>
                                  <p className="mt-2 text-sm text-emerald-900">
                                    {visitDetail?.observations_visited ?? "Sin información registrada."}
                                  </p>
                                </div>
                                <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                                  <p className="text-xs uppercase tracking-[0.1em] text-emerald-600">
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
                                          <p className="px-3 py-2 text-sm font-semibold text-emerald-900">
                                            {photo.label}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="mt-2 text-sm text-emerald-700">
                                      No se adjuntaron imágenes en esta visita.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </SectionCard>

                            {focalizationEntries.length > 0 ? (
                              <SectionCard
                                number="5.0"
                                title="Medición y focalización"
                              >
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

                            <SectionCard
                              number="6."
                              title="Datos del Acompañamiento"
                            >
                              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                <FieldItem
                                  label="6.1 Nombre Persona quien atiende el Acompañamiento"
                                  value={visitDetail?.name_acompanamiento ?? visitDetail?.attended_by}
                                />
                                <FieldItem
                                  label="6.2 Si quien atiende la visita es diferente al productor"
                                  value={visitDetail?.attended_by}
                                />
                                <FieldItem
                                  label="Fecha y hora registro Acompañamiento"
                                  value={
                                    visitDetail?.date_acompanamiento
                                      ? `${formatDate(visitDetail.date_acompanamiento)} ${visitDetail.hour_acompanamiento ?? ""}`.trim()
                                      : undefined
                                  }
                                />
                                <FieldItem
                                  label="Origen registro"
                                  value={visitDetail?.origen_register}
                                />
                                <FieldItem
                                  label="Fecha de la visita"
                                  value={formatDate(visitDetail?.visit_date)}
                                />
                                <FieldItem
                                  label="Estado actual"
                                  value={visitDetail?.state}
                                />
                              </div>
                            </SectionCard>

                            <SectionCard
                              number="7."
                              title="Datos Del Extensionista"
                            >
                              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                <FieldItem
                                  label="7.1 Nombre del Extensionista"
                                  value={(visitExtensionist as any)?.name}
                                />
                                <FieldItem
                                  label="7.2 Identificación Del Extensionista"
                                  value={(visitExtensionist as any)?.identification}
                                />
                                <FieldItem
                                  label="7.3 Perfil Profesional Del Extensionista"
                                  value={(visitExtensionist as any)?.professional_profile}
                                />
                                <FieldItem
                                  label="7.4 Fecha firma extensionista"
                                  value={
                                    formatDate(visitDetail?.date_hour_end ?? visitDetail?.date_acompanamiento)
                                  }
                                />
                                <div className="rounded-lg border border-emerald-50 bg-emerald-50/60 px-3 py-2">
                                  <p className="text-xs uppercase tracking-[0.08em] text-emerald-600">
                                    7.5 Firma extensionista
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
    </div>
  );
};
