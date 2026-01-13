import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.API_BASE_URL ?? "https://adr.ricardopupo.co/api/v1";

const isBinaryContent = (contentType: string) =>
  /octet-stream|excel|spreadsheetml|application\/vnd/.test(contentType);

async function forward(request: NextRequest) {
  let targetPath = request.nextUrl.pathname.replace(/^\/api\/proxy/, "");
  // Solo forzamos "/" final en endpoints de extensionists que lo requieren
  if (/\/extensionists\/\d+\/(summary|export-excel)\/?$/.test(targetPath)) {
    if (!targetPath.endsWith("/")) {
      targetPath = `${targetPath}/`;
    }
  }
  if (/\/admin\/surveys\/\d+\/\d+\/state\/?$/.test(targetPath)) {
    if (!targetPath.endsWith("/")) {
      targetPath = `${targetPath}/`;
    }
  }
  const targetUrl = `${API_BASE_URL}${targetPath}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() === "host") return;
    headers.set(key, value);
  });

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "follow",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    const bodyBuffer = await request.arrayBuffer();
    if (bodyBuffer.byteLength > 0) {
      init.body = bodyBuffer;
    }
  }

  const response = await fetch(targetUrl, { ...init, cache: "no-store" });
  const contentType = response.headers.get("Content-Type") || "";

  if (isBinaryContent(contentType)) {
    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      status: response.status,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": response.headers.get("Content-Disposition") || "",
      },
    });
  }

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      "Content-Type": contentType || "application/json",
    },
  });
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    return await forward(request);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Proxy error", message: error?.message },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return await forward(request);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Proxy error", message: error?.message },
      { status: 502 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    return await forward(request);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Proxy error", message: error?.message },
      { status: 502 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    return await forward(request);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Proxy error", message: error?.message },
      { status: 502 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    return await forward(request);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Proxy error", message: error?.message },
      { status: 502 },
    );
  }
}
