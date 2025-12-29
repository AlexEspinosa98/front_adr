"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { Session } from "next-auth";
import { getSession, signIn } from "next-auth/react";
import { FiKey, FiLock, FiMail } from "react-icons/fi";

interface LoginPayload {
  email: string;
  password: string;
}

const INPUT_STYLES =
  "w-full rounded-md border border-emerald-200 px-4 py-3 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100";

export default function LoginPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const signInResponse = await signIn("credentials", {
        email: payload.email,
        password: payload.password,
        redirect: false,
      });

      if (signInResponse?.error || signInResponse?.ok === false) {
        throw new Error(signInResponse?.error ?? "Credenciales inválidas.");
      }

      return payload;
    },
    onSuccess: async () => {
      const session = (await getSession()) as (Session & {
        accessToken?: string;
        tokenType?: string;
      }) | null;
      const accessToken = session?.accessToken;
      const tokenType = session?.tokenType ?? "Token";

      if (accessToken) {
        window.localStorage.setItem("access_token", accessToken);
        window.localStorage.setItem("access_token_type", tokenType);
      }

      setErrorMessage(null);
      router.push("/dashboard");
    },
    onError: () => {
      setErrorMessage("Credenciales inválidas.");
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    loginMutation.mutate({ email, password });
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-emerald-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-emerald-100">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <FiLock aria-hidden size={22} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-emerald-900">
              Panel Administrativo
            </h1>
            <p className="text-sm text-emerald-600">
              Ingresa tus credenciales para continuar.
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-emerald-800">
            Email
            <div className="mt-1 flex items-center gap-2">
              <FiMail aria-hidden className="text-emerald-400" />
              <input
                className={INPUT_STYLES}
                name="email"
                placeholder="admin@empresa.com"
                required
                type="email"
              />
            </div>
          </label>

          <label className="block text-sm font-medium text-emerald-800">
            Contraseña
            <div className="mt-1 flex items-center gap-2">
              <FiKey aria-hidden className="text-emerald-400" />
              <input
                className={INPUT_STYLES}
                name="password"
                placeholder="••••••••"
                required
                type="password"
              />
            </div>
          </label>

          {errorMessage ? (
            <p className="text-sm font-medium text-red-600">{errorMessage}</p>
          ) : null}

          <button
            className="mt-4 w-full rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
            disabled={loginMutation.isPending}
            type="submit"
          >
            {loginMutation.isPending ? "Validando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </section>
  );
}
