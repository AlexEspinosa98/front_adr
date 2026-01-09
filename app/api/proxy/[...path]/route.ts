import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.API_BASE_URL ?? "https://adr.ricardopupo.co/api/v1";

async function proxyRequest(request: NextRequest, originalPath: string) {
  const targetPath = originalPath.startsWith("/")
    ? originalPath
    : `/${originalPath}`;
  const targetUrl = `${API_BASE_URL}${targetPath}${request.nextUrl.search}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Forward authorization header if present
  const authHeader = request.headers.get("Authorization");
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  try {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    // Only include body for methods that support it
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      const body = await request.text();
      if (body) {
        fetchOptions.body = body;
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get("Content-Type") || "";
    const isBinary =
      /octet-stream|excel|spreadsheetml|application\/vnd/.test(contentType);

    if (isBinary) {
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        status: response.status,
        headers: {
          "Content-Type": contentType || "application/octet-stream",
          "Content-Disposition": response.headers.get("Content-Disposition") || "",
        },
      });
    }

    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": contentType || "application/json",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Error connecting to backend server" },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const originalPath =
    request.nextUrl.pathname.replace(/^\/api\/proxy/, "") ||
    `/${path.join("/")}`;
  return proxyRequest(request, originalPath);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const originalPath =
    request.nextUrl.pathname.replace(/^\/api\/proxy/, "") ||
    `/${path.join("/")}`;
  return proxyRequest(request, originalPath);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const originalPath =
    request.nextUrl.pathname.replace(/^\/api\/proxy/, "") ||
    `/${path.join("/")}`;
  return proxyRequest(request, originalPath);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const originalPath =
    request.nextUrl.pathname.replace(/^\/api\/proxy/, "") ||
    `/${path.join("/")}`;
  return proxyRequest(request, originalPath);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const originalPath =
    request.nextUrl.pathname.replace(/^\/api\/proxy/, "") ||
    `/${path.join("/")}`;
  return proxyRequest(request, originalPath);
}
