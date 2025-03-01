// instrumentation-node.ts
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { HostMetrics } from '@opentelemetry/host-metrics';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import {
    Resource,
    detectResourcesSync,
    envDetector,
    hostDetector,
    processDetector,
} from '@opentelemetry/resources';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import {
    ATTR_SERVICE_NAME,
} from '@opentelemetry/semantic-conventions';

console.log("Registering prometheus exporter...");

const exporter = new PrometheusExporter({
    port: 9464,
});
const detectedResources = detectResourcesSync({
    detectors: [envDetector, processDetector, hostDetector],
});

const customResources = new Resource({
    [ATTR_SERVICE_NAME]: 'aiden-frontend',
});

const resources = detectedResources.merge(customResources);

const meterProvider = new MeterProvider({
    readers: [exporter],
    resource: resources,
});
const hostMetrics = new HostMetrics({
    name: `aiden-frontend`,
    meterProvider,
});

registerInstrumentations({
    meterProvider,
    instrumentations: [
        new HttpInstrumentation(),
        new RuntimeNodeInstrumentation(),
    ],
});

hostMetrics.start();