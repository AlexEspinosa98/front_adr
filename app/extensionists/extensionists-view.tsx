"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";

import {
  Extensionist,
  ExtensionistFilters,
  fetchExtensionists,
} from "@/services/extensionists";

type FilterFormState = {
  name: string;
  identification: string;
  email: string;
  phone: string;
  city: string;
};

type SessionWithToken = Session & { accessToken?: string };

const INITIAL_FORM_STATE: FilterFormState = {
  name: "",
  identification: "",
  email: "",
  phone: "",
  city: "",
};

const FILTER_LABELS: Record<keyof ExtensionistFilters, string> = {
  name: "Nombre",
  email: "Correo",
  identification: "Documento",
  phone: "Teléfono",
  city: "Ciudad",
};

const sanitizeFormFilters = (filters: FilterFormState): ExtensionistFilters => {
  const sanitized: ExtensionistFilters = {};
  (Object.entries(filters) as [keyof FilterFormState, string][]).forEach(
    ([key, value]) => {
      const trimmedValue = value.trim();
      if (trimmedValue) {
        sanitized[key] = trimmedValue;
      }
    },
  );

  return sanitized;
};

const ExtensionistRow = ({ extensionist }: { extensionist: Extensionist }) => (
  <li className="flex flex-col gap-1 border-b border-emerald-100 pb-4 pt-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
    <div>
      <p className="text-base font-semibold text-emerald-900">
        {extensionist.name}
      </p>
      <p className="text-sm text-emerald-500">
        Doc: {extensionist.identification}
      </p>
    </div>
    <div className="text-sm text-emerald-600 md:text-right">
      <p className="font-medium">{extensionist.phone}</p>
    </div>
  </li>
);

export const ExtensionistsView = () => {
  const { data: session } = useSession();
  const accessToken = (session as SessionWithToken | null)?.accessToken;
  const [formFilters, setFormFilters] = useState<FilterFormState>(
    INITIAL_FORM_STATE,
  );
  const [appliedFilters, setAppliedFilters] = useState<ExtensionistFilters>({});
  const queryClient = useQueryClient();

  const { data, isLoading, isError, isFetching, error } = useQuery({
    queryKey: ["extensionists", appliedFilters, accessToken],
    queryFn: () => fetchExtensionists(appliedFilters, accessToken),
    enabled: Boolean(accessToken),
  });

  const extensionists = data?.data ?? [];
  const hasResults = extensionists.length > 0;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters(sanitizeFormFilters(formFilters));
    queryClient.invalidateQueries({ queryKey: ["extensionists"] });
  };

  const handleClearFilters = () => {
    setFormFilters(INITIAL_FORM_STATE);
    setAppliedFilters({});
    queryClient.invalidateQueries({ queryKey: ["extensionists"] });
  };

  const activeFiltersDescription = useMemo(() => {
    if (Object.keys(appliedFilters).length === 0) {
      return "Mostrando todos los extensionistas";
    }
    return `Filtros activos: ${Object.entries(appliedFilters)
      .map(([key, value]) => `${FILTER_LABELS[key as keyof ExtensionistFilters]}: ${value}`)
      .join(", ")}`;
  }, [appliedFilters]);

  return (
    <div className="w-full max-w-6xl space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-emerald-100">
        <div className="mb-6 space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
            Extensionistas
          </p>
          <h1 className="text-2xl font-semibold text-emerald-900">
            Consulta de extensionistas
          </h1>
          <p className="text-sm text-emerald-500">
            Filtra por nombre, correo, documento, teléfono o ciudad/municipio
            para encontrar fácilmente a un extensionista.
          </p>
        </div>

        <form
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
          onSubmit={handleSubmit}
        >
          <label className="text-sm font-medium text-emerald-700">
            Nombre
            <input
              className="mt-1 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              name="name"
              onChange={handleChange}
              placeholder="Nombre"
              value={formFilters.name}
            />
          </label>

          <label className="text-sm font-medium text-emerald-700">
            Documento
            <input
              className="mt-1 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              name="identification"
              onChange={handleChange}
              placeholder="Ej. 123456789"
              value={formFilters.identification}
            />
          </label>

          <label className="text-sm font-medium text-emerald-700">
            Correo
            <input
              className="mt-1 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              name="email"
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              value={formFilters.email}
            />
          </label>

          <label className="text-sm font-medium text-emerald-700">
            Teléfono
            <input
              className="mt-1 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              name="phone"
              onChange={handleChange}
              placeholder="Ej. 3000000000"
              value={formFilters.phone}
            />
          </label>

          <label className="text-sm font-medium text-emerald-700">
            Ciudad
            <input
              className="mt-1 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              name="city"
              onChange={handleChange}
              placeholder="Ej. Santa Marta"
              value={formFilters.city}
            />
          </label>

          <div className="flex flex-col gap-2 pt-2 md:col-span-2 md:flex-row md:items-center md:justify-end">
            <button
              className="rounded-md border border-transparent bg-emerald-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
              type="submit"
            >
              Buscar
            </button>
            <button
              className="rounded-md border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900"
              onClick={handleClearFilters}
              type="button"
            >
              Limpiar filtros
            </button>
            {isFetching ? (
              <span className="text-xs text-emerald-500">Actualizando...</span>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-emerald-100">
        <div className="flex flex-col gap-2 border-b border-emerald-100 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-900">
              Resultados ({extensionists.length})
            </p>
            <p className="text-xs text-emerald-500">{activeFiltersDescription}</p>
          </div>
        </div>

        {isLoading ? (
          <p className="py-6 text-sm text-emerald-500">Cargando extensionistas…</p>
        ) : isError ? (
          <div className="py-6 text-sm text-red-600">
            No fue posible obtener los extensionistas. {error?.message}
          </div>
        ) : hasResults ? (
          <ul className="divide-y divide-transparent">
            {extensionists.map((extensionist) => (
              <ExtensionistRow
                extensionist={extensionist}
                key={extensionist.id}
              />
            ))}
          </ul>
        ) : (
          <p className="py-6 text-sm text-emerald-500">
            No se encontraron extensionistas con los filtros seleccionados.
          </p>
        )}
      </section>
    </div>
  );
};
