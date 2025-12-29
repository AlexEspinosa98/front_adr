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
} from "react-icons/fi";

import {
  Extensionist,
  ExtensionistFilters,
  fetchExtensionistsFull,
} from "@/services/extensionists";
import {
  ExtensionistProperty,
  fetchExtensionistProperties,
  PropertySurvey,
  fetchPropertySurveys,
  fetchSurveyDetail,
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
  const [selectedSurvey, setSelectedSurvey] = useState<PropertySurvey | null>(
    null,
  );
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
    setSelectedSurvey(null);
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

  const {
    data: surveysResponse,
    isLoading: surveysLoading,
    isError: surveysError,
    error: surveysFetchError,
    isFetching: surveysFetching,
  } = useQuery({
    queryKey: [
      "property-surveys-full",
      selectedProperty?.id,
      accessToken,
      tokenType,
    ],
    queryFn: () =>
      fetchPropertySurveys(selectedProperty!.id, accessToken, tokenType),
    enabled: Boolean(selectedProperty && accessToken),
  });

  const surveys = surveysResponse?.data ?? [];

  const {
    data: surveyDetailResponse,
    isLoading: surveyDetailLoading,
    isError: surveyDetailError,
    error: surveyDetailFetchError,
  } = useQuery({
    queryKey: [
      "survey-detail-full",
      selectedSurvey?.surveyTypeId,
      selectedSurvey?.id,
      accessToken,
      tokenType,
    ],
    queryFn: () =>
      fetchSurveyDetail(
        selectedSurvey!.surveyTypeId,
        selectedSurvey!.id,
        accessToken,
        tokenType,
      ),
    enabled: Boolean(selectedSurvey && accessToken),
  });

  const surveyDetail = surveyDetailResponse?.data;

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
    setSelectedSurvey(null);
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
                        setSelectedSurvey(null);
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
                                  setSelectedSurvey(null);
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
                                    setSelectedSurvey(null);
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
                  description="Selecciona una propiedad y navega entre las encuestas disponibles (1, 2 y 3)."
                />

                {!selectedProperty ? (
                  <p className="text-sm text-emerald-500">
                    Selecciona una propiedad para ver sus encuestas.
                  </p>
                ) : surveys.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {[0, 1, 2].map((index) => {
                        const survey = surveys[index];
                        const isActive =
                          survey && survey.id === selectedSurvey?.id;
                        return (
                          <button
                            key={survey ? survey.id : `placeholder-${index}`}
                            className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                              survey && isActive
                                ? "border-emerald-900 bg-emerald-900 text-white"
                                : "border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:text-emerald-900"
                            }`}
                            disabled={!survey}
                            onClick={() => survey && setSelectedSurvey(survey)}
                            type="button"
                          >
                            Encuesta {index + 1}
                            <span className="text-xs font-normal">
                              {survey ? survey.surveyType : "No disponible"}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedSurvey ? (
                      surveyDetail ? (
                        <div className="grid gap-3 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm md:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-[0.1em] text-emerald-500">
                              Tipo de encuesta
                            </p>
                            <p className="text-base font-semibold text-emerald-900">
                              {selectedSurvey.surveyType}
                            </p>
                            <p className="text-sm text-emerald-500">
                              Estado: {selectedSurvey.status ?? "Sin estado"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.1em] text-emerald-500">
                              Recomendaciones
                            </p>
                            <p className="text-sm text-emerald-700 whitespace-pre-line">
                              {(surveyDetail.recommendations as string) ?? "N/D"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.1em] text-emerald-500">
                              Productor
                            </p>
                            <p className="text-sm font-semibold text-emerald-900">
                              {(surveyDetail.producer as { name?: string })?.name ??
                                "N/D"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.1em] text-emerald-500">
                              Propiedad
                            </p>
                            <p className="text-sm font-semibold text-emerald-900">
                              {(surveyDetail.property as { name?: string })?.name ??
                                selectedProperty.name}
                            </p>
                          </div>
                        </div>
                      ) : surveyDetailLoading ? (
                        <p className="text-sm text-emerald-500">
                          Cargando detalle de la encuesta…
                        </p>
                      ) : surveyDetailError ? (
                        <p className="text-sm text-red-600">
                          No fue posible obtener el detalle:{" "}
                          {surveyDetailFetchError?.message ?? "Error desconocido."}
                        </p>
                      ) : null
                    ) : (
                      <p className="text-sm text-emerald-500">
                        Elige una encuesta para ver su detalle.
                      </p>
                    )}
                  </div>
                ) : (
                  renderListState({
                    isLoading: surveysLoading,
                    isFetching: surveysFetching,
                    isError: surveysError,
                    errorMessage: surveysFetchError?.message,
                    emptyLabel:
                      "La propiedad seleccionada no tiene encuestas registradas.",
                  })
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
