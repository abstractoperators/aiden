
export async function register() {
    try {
        console.log("Registering OpenTelemetry...");
        await import("./instrumentation-node");
        console.log("OpenTelemetry registration successful");
    } catch (error) {
        console.error("Failed to register OpenTelemetry:", error);
        throw error;
    }
}