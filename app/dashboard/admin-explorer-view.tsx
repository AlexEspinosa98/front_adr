"use client";

import {
  FormEvent,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Session } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import {
  FiActivity,
  FiBarChart2,
  FiCheckCircle,
  FiChevronRight,
  FiDownload,
  FiHome,
  FiLogOut,
  FiMapPin,
  FiPieChart,
  FiSearch,
  FiUsers,
} from "react-icons/fi";

import {
  Extensionist,
  ExtensionistFilters,
  fetchExtensionists,
} from "@/services/extensionists";
import {
  ExtensionistProperty,
  PropertySurvey,
  downloadSurveyPdf,
  fetchExtensionistProperties,
  fetchPropertySurveys,
  fetchSurveyDetail,
} from "@/services/properties";
import { fetchSurveyStatistics } from "@/services/statistics";
import { ExtensionistChart } from "./charts/ExtensionistChart";
import { CityChart } from "./charts/CityChart";
import { ProductiveLineChart } from "./charts/ProductiveLineChart";

type SessionWithToken = Session & { accessToken?: string };

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
  const [cityInput, setCityInput] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [selectedExtensionist, setSelectedExtensionist] =
    useState<Extensionist | null>(null);
  const [selectedProperty, setSelectedProperty] =
    useState<ExtensionistProperty | null>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<PropertySurvey | null>(
    null,
  );
  const [activeView, setActiveView] = useState<"stats" | "visits">("stats");
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);
  const { data: statsResponse, isLoading: statsLoading, isError: statsError } =
    useQuery({
      queryKey: ["survey-statistics", accessToken],
      queryFn: () => fetchSurveyStatistics(accessToken),
      enabled: Boolean(accessToken),
    });

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sanitizedCity = cityInput.trim();
    setCityFilter(sanitizedCity);
    setSelectedExtensionist(null);
    setSelectedProperty(null);
    setSelectedSurvey(null);
  };

  const {
    data: extensionistsResponse,
    isLoading: extensionistsLoading,
    isError: extensionistsError,
    error: extensionistsFetchError,
    refetch: refetchExtensionists,
    isFetching: extensionistsFetching,
  } = useQuery({
    queryKey: ["extensionists-city", cityFilter, accessToken],
    queryFn: () => {
      const filters: ExtensionistFilters = {};
      if (cityFilter) {
        filters.city = cityFilter;
      }
      return fetchExtensionists(filters, accessToken);
    },
    enabled: Boolean(accessToken),
  });

  const extensionists = extensionistsResponse?.data ?? [];

  const {
    data: propertiesResponse,
    isLoading: propertiesLoading,
    isError: propertiesError,
    error: propertiesFetchError,
    isFetching: propertiesFetching,
  } = useQuery({
    queryKey: ["extensionist-properties", selectedExtensionist?.id, accessToken],
    queryFn: () =>
      fetchExtensionistProperties(selectedExtensionist!.id, accessToken),
    enabled: Boolean(selectedExtensionist && accessToken),
  });

  const properties = propertiesResponse?.data ?? [];

  const {
    data: surveysResponse,
    isLoading: surveysLoading,
    isError: surveysError,
    error: surveysFetchError,
    isFetching: surveysFetching,
  } = useQuery({
    queryKey: ["property-surveys", selectedProperty?.id, accessToken],
    queryFn: () => fetchPropertySurveys(selectedProperty!.id, accessToken),
    enabled: Boolean(selectedProperty && accessToken),
  });

  const surveys = surveysResponse?.data ?? [];

  const {
    data: surveyDetailResponse,
    isLoading: surveyDetailLoading,
    isError: surveyDetailError,
    error: surveyDetailFetchError,
    refetch: refetchSurveyDetail,
  } = useQuery({
    queryKey: [
      "survey-detail",
      selectedSurvey?.surveyTypeId,
      selectedSurvey?.id,
      accessToken,
    ],
    queryFn: () =>
      fetchSurveyDetail(
        selectedSurvey!.surveyTypeId,
        selectedSurvey!.id,
        accessToken,
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

  const clearDownloadMessage = () => setDownloadMessage(null);

  const handleLogout = () => {
    window.localStorage.removeItem("access_token");
    signOut({ callbackUrl: "/login" });
  };

  const downloadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSurvey || !accessToken) {
        throw new Error("Selecciona una encuesta para descargar su PDF.");
      }
      return downloadSurveyPdf(
        selectedSurvey.surveyTypeId,
        selectedSurvey.id,
        accessToken,
      );
    },
    onMutate: () => {
      clearDownloadMessage();
    },
    onSuccess: (blob) => {
      if (!selectedSurvey) {
        return;
      }
      const fileName = `survey_${selectedSurvey.surveyTypeId}_${selectedSurvey.id}.pdf`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
      setDownloadMessage("PDF descargado correctamente.");
    },
    onError: (error) => {
      setDownloadMessage(
        error instanceof Error
          ? error.message
          : "No fue posible descargar el PDF.",
      );
    },
  });

  const handleExtensionistSelect = (extensionist: Extensionist) => {
    setSelectedExtensionist(extensionist);
    setSelectedProperty(null);
    setSelectedSurvey(null);
  };

  const handlePropertySelect = (property: ExtensionistProperty) => {
    setSelectedProperty(property);
    setSelectedSurvey(null);
  };

  const handleSurveySelect = (survey: PropertySurvey) => {
    setSelectedSurvey(survey);
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

  const formattedSurveyDetail = useMemo(() => {
    if (!surveyDetail) {
      return null;
    }

    const producer = surveyDetail.producer as
      | { name?: string; identification?: string }
      | undefined;
    const property = surveyDetail.property as
      | { name?: string; city?: string; municipality?: string }
      | undefined;
    const extensionistInfo = surveyDetail.extensionist as
      | { name?: string; phone?: string }
      | undefined;

    return {
      producer,
      property,
      extensionist: extensionistInfo,
      recommendations: surveyDetail.recommendations as string | undefined,
      status: surveyDetail.status as string | undefined,
    };
  }, [surveyDetail]);

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
                    : "Revisión de visitas y encuestas"}
                </h1>
                <p className="mt-3 text-base text-emerald-200">
                  {activeView === "stats"
                    ? "Explora totales, cobertura y top extensionistas."
                    : "Filtra extensionistas, revisa fincas, encuestas y descargas."}
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
                  title="1. Filtra extensionistas por ciudad"
                  description="Aplica el filtro de ciudad para obtener el listado inicial."
                />

            <form
              className="flex flex-col gap-3 md:flex-row"
              onSubmit={handleFilterSubmit}
            >
              <input
                className="flex-1 rounded-md border border-emerald-200 px-4 py-2 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="Ej. Santa Marta"
                value={cityInput}
                onChange={(event) => setCityInput(event.target.value)}
              />
              <div className="flex gap-2">
                <button
                  className="flex items-center justify-center gap-2 rounded-md bg-emerald-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  type="submit"
                  disabled={!accessToken}
                >
                  <FiSearch aria-hidden />
                  Buscar
                </button>
                <button
                  className="rounded-md border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900"
                  type="button"
                  onClick={() => {
                    setCityInput("");
                    setCityFilter("");
                    setSelectedExtensionist(null);
                    setSelectedProperty(null);
                    setSelectedSurvey(null);
                    refetchExtensionists();
                  }}
                >
                  Limpiar
                </button>
              </div>
            </form>

            {extensionists.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-emerald-100 text-sm">
                  <thead>
                    <tr className="text-left text-emerald-500">
                      <th className="pb-3 font-medium">Nombre</th>
                      <th className="pb-3 font-medium">Documento</th>
                      <th className="pb-3 font-medium">Teléfono</th>
                      <th className="pb-3 font-medium">Ciudad</th>
                      <th className="pb-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100">
                    {extensionists.map((extensionist) => {
                      const isActive =
                        extensionist.id === selectedExtensionist?.id;
                      return (
                        <tr
                          key={extensionist.id}
                          className={isActive ? "bg-emerald-50" : undefined}
                        >
                          <td className="py-3 font-semibold text-emerald-900">
                            {extensionist.name}
                          </td>
                          <td className="py-3 text-emerald-600">
                            {extensionist.identification}
                          </td>
                          <td className="py-3 text-emerald-600">
                            {extensionist.phone}
                          </td>
                          <td className="py-3 text-emerald-600">
                            {extensionist.city ?? "—"}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900"
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
            ) : (
              renderListState({
                isLoading: extensionistsLoading,
                isFetching: extensionistsFetching,
                isError: extensionistsError,
                errorMessage: extensionistsFetchError?.message,
                emptyLabel:
                  cityFilter.length > 0
                    ? "No se encontraron extensionistas para la ciudad indicada."
                    : "Aún no se han consultado extensionistas. Ingresa una ciudad para comenzar.",
              })
            )}
          </section>

          <section className={SECTION_CLASS}>
            <SectionHeader
              icon={<FiHome aria-hidden />}
              title="2. Revisa las fincas asignadas"
              description="Selecciona una finca para consultar las encuestas levantadas en ella."
            />

            {!selectedExtensionist ? (
              <p className="text-sm text-emerald-500">
                Selecciona primero un extensionista para ver sus propiedades.
              </p>
            ) : properties.length > 0 ? (
              <ul className="divide-y divide-emerald-100 text-sm">
                {properties.map((property) => {
                  const isActive = property.id === selectedProperty?.id;
                  return (
                    <li
                      key={property.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="font-semibold text-emerald-900">
                          {property.name}
                        </p>
                        <p className="text-xs text-emerald-500">
                          {property.city ??
                            property.municipality ??
                            "Ciudad N/D"}
                          {property.address ? ` · ${property.address}` : ""}
                        </p>
                      </div>
                      <button
                        className={`inline-flex items-center gap-1 rounded-md border px-3 py-1 text-xs font-semibold transition ${
                          isActive
                            ? "border-emerald-900 bg-emerald-900 text-white"
                            : "border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:text-emerald-900"
                        }`}
                        type="button"
                        onClick={() => handlePropertySelect(property)}
                      >
                        Ver encuestas
                        <FiChevronRight aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              renderListState({
                isLoading: propertiesLoading,
                isFetching: propertiesFetching,
                isError: propertiesError,
                errorMessage: propertiesFetchError?.message,
                emptyLabel:
                  "No hay registros de propiedades para el extensionista seleccionado.",
              })
            )}
          </section>

              <section className={SECTION_CLASS}>
                <SectionHeader
                  icon={<FiUsers aria-hidden />}
                  title="3. Audita encuestas por finca"
                  description="Consulta el listado de encuestas y el enlace al PDF generado."
                />

            {!selectedProperty ? (
              <p className="text-sm text-emerald-500">
                Selecciona una finca para mostrar sus encuestas.
              </p>
            ) : surveys.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-emerald-100 text-sm">
                  <thead>
                    <tr className="text-left text-emerald-500">
                      <th className="pb-3 font-medium">Encuesta</th>
                      <th className="pb-3 font-medium">Tipo</th>
                      <th className="pb-3 font-medium">Estado</th>
                      <th className="pb-3 font-medium">PDF</th>
                      <th className="pb-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100">
                    {surveys.map((survey) => {
                      const isActive = survey.id === selectedSurvey?.id;
                      return (
                        <tr
                          key={`${survey.surveyTypeId}-${survey.id}`}
                          className={isActive ? "bg-emerald-50" : undefined}
                        >
                          <td className="py-3 font-semibold text-emerald-900">
                            #{survey.id}
                          </td>
                          <td className="py-3 text-emerald-600">
                            {survey.surveyType}
                          </td>
                          <td className="py-3 text-emerald-600">
                            {survey.status ?? "Sin estado"}
                          </td>
                          <td className="py-3 text-emerald-600">
                            {survey.pdfUrl ? (
                              <a
                                className="text-sm text-blue-600 underline"
                                href={survey.pdfUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                Ver PDF
                              </a>
                            ) : (
                              "Pendiente"
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900"
                              type="button"
                              onClick={() => handleSurveySelect(survey)}
                            >
                              Detalles
                              <FiChevronRight aria-hidden />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              renderListState({
                isLoading: surveysLoading,
                isFetching: surveysFetching,
                isError: surveysError,
                errorMessage: surveysFetchError?.message,
                emptyLabel:
                  "Esta finca aún no tiene encuestas asociadas o no pudieron consultarse.",
              })
            )}
          </section>

              <section className={SECTION_CLASS}>
                <SectionHeader
                  icon={<FiCheckCircle aria-hidden />}
                  title="4. Consulta el detalle y descarga el PDF oficial"
                  description="Visualiza el contenido de la encuesta y fuerza la descarga del PDF emitido."
                />

            {!selectedSurvey ? (
              <p className="text-sm text-emerald-500">
                Selecciona una encuesta para inspeccionar su contenido.
              </p>
            ) : surveyDetail ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-emerald-100 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
                      Productor
                    </p>
                    <p className="mt-2 text-base font-semibold text-emerald-900">
                      {formattedSurveyDetail?.producer?.name ?? "Sin nombre"}
                    </p>
                    <p className="text-sm text-emerald-500">
                      Documento:{" "}
                      {formattedSurveyDetail?.producer?.identification ??
                        "No disponible"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-100 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
                      Finca
                    </p>
                    <p className="mt-2 text-base font-semibold text-emerald-900">
                      {formattedSurveyDetail?.property?.name ?? "Sin nombre"}
                    </p>
                    <p className="text-sm text-emerald-500">
                      {formattedSurveyDetail?.property?.city ??
                        formattedSurveyDetail?.property?.municipality ??
                        "Ciudad no registrada"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-100 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
                      Extensionista
                    </p>
                    <p className="mt-2 text-base font-semibold text-emerald-900">
                      {formattedSurveyDetail?.extensionist?.name ??
                        "Sin nombre"}
                    </p>
                    <p className="text-sm text-emerald-500">
                      Teléfono:{" "}
                      {formattedSurveyDetail?.extensionist?.phone ??
                        selectedExtensionist?.phone ??
                        "No disponible"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-100 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
                      Estado general
                    </p>
                    <p className="mt-2 text-base font-semibold text-emerald-900">
                      {formattedSurveyDetail?.status ?? "Sin estado"}
                    </p>
                    <p className="text-sm text-emerald-500">
                      Encuesta #{selectedSurvey.id} · Tipo{" "}
                      {selectedSurvey.surveyType}
                    </p>
                  </div>
                </div>

                {formattedSurveyDetail?.recommendations ? (
                  <div className="rounded-xl border border-dashed border-emerald-200 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
                      Recomendaciones del extensionista
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm text-emerald-700">
                      {formattedSurveyDetail.recommendations}
                    </p>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 pt-2 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-emerald-500">
                    {downloadMessage}
                    {!downloadMessage &&
                      (surveyDetailError
                        ? `No fue posible obtener el detalle: ${surveyDetailFetchError?.message ?? ""}`
                        : null)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900"
                      type="button"
                      onClick={() => {
                        refetchSurveyDetail();
                      }}
                    >
                      Actualizar detalle
                    </button>
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-700"
                      type="button"
                      disabled={downloadMutation.isPending}
                      onClick={() => downloadMutation.mutate()}
                    >
                      <FiDownload aria-hidden />
                      {downloadMutation.isPending
                        ? "Descargando..."
                        : "Descargar PDF oficial"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              renderListState({
                isLoading: surveyDetailLoading,
                isError: surveyDetailError ?? false,
                errorMessage: surveyDetailFetchError?.message,
                emptyLabel:
                  "Selecciona una encuesta y espera el detalle desde el backend.",
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
