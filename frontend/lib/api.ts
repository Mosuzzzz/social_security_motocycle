const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
    refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
    refreshSubscribers.map((cb) => cb(token));
    refreshSubscribers = [];
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string>),
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401 && typeof window !== "undefined" && !endpoint.includes("/auth/refresh") && !endpoint.includes("/login")) {
            // Handle 401 Unauthorized (Refresh Token logic)
            // ... (keeping existing logic roughly same but simplified error handling)
            // For now, let's keep it simple as parsing logic is the main issue

            if (!isRefreshing) {
                isRefreshing = true;
                const refreshToken = localStorage.getItem("refresh_token");

                if (!refreshToken) {
                    throw new Error("Session expired");
                }

                try {
                    const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ refresh_token: refreshToken }),
                    });

                    if (!refreshResponse.ok) {
                        throw new Error("Refresh failed");
                    }

                    const data = await refreshResponse.json();
                    localStorage.setItem("token", data.access_token);
                    localStorage.setItem("refresh_token", data.refresh_token);

                    isRefreshing = false;
                    onRefreshed(data.access_token);

                    // Retry original request
                    return apiFetch(endpoint, options);
                } catch (err) {
                    isRefreshing = false;
                    localStorage.removeItem("token");
                    localStorage.removeItem("refresh_token");
                    window.location.href = "/login";
                    throw err;
                }
            } else {
                return new Promise((resolve) => {
                    subscribeTokenRefresh(() => {
                        resolve(apiFetch(endpoint, options));
                    });
                });
            }
        }

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { message: errorText || response.statusText };
            }
            throw new Error(errorData.message || `Request failed: ${response.status}`);
        }

        if (response.status === 204) {
            return null;
        }

        const text = await response.text();
        if (!text) {
            return null;
        }

        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse JSON response:", text);
            // If it's not JSON but successful, maybe just return text?
            // But apiFetch usually expects JSON. Let's return null to be safe or throw.
            // Returning null avoids breaking the UI if the backend returns plain text "OK".
            return null;
        }

    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}
