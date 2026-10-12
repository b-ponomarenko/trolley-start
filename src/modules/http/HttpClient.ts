import axios, { isAxiosError } from 'axios';
import type {
  AxiosInstance,
  AxiosRequestConfig,
  CreateAxiosDefaults,
  InternalAxiosRequestConfig,
} from 'axios';
import type { Logger } from '../logger/tokens';

export interface HttpClientOptions extends CreateAxiosDefaults {
  /** Identifies the client in logs and errors, e.g. `rick-and-morty`. */
  name: string;
}

/** Per-request options: everything axios accepts except what the method itself defines. */
export type RequestOptions = Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>;

/**
 * A failed request, normalised across axios error shapes. `status` is absent for network errors,
 * timeouts and aborted requests.
 */
export class HttpError extends Error {
  readonly client: string;

  readonly status: number | undefined;

  readonly code: string | undefined;

  readonly url: string;

  constructor(client: string, url: string, message: string, status?: number, code?: string) {
    super(message);
    this.name = 'HttpError';
    this.client = client;
    this.url = url;
    this.status = status;
    this.code = code;
  }
}

const startedAt = new WeakMap<InternalAxiosRequestConfig, number>();

const now = () => (typeof performance === 'undefined' ? Date.now() : performance.now());

/**
 * A named HTTP client over an axios instance. Methods resolve with the response body and reject
 * with `HttpError`; the raw instance stays reachable as `client.axios` for interceptors and
 * anything else axios can do.
 */
export class HttpClient {
  readonly name: string;

  readonly axios: AxiosInstance;

  constructor({ name, ...axiosOptions }: HttpClientOptions, logger?: Logger | null) {
    this.name = name;
    this.axios = axios.create(axiosOptions);

    if (logger) {
      this.axios.interceptors.request.use((config) => {
        startedAt.set(config, now());

        return config;
      });
      this.axios.interceptors.response.use(
        (response) => {
          logger.debug(this.describe(response.config, String(response.status)));

          return response;
        },
        (error: unknown) => {
          if (isAxiosError(error) && error.config) {
            logger.warn(
              this.describe(error.config, String(error.response?.status ?? error.code ?? 'failed'))
            );
          }

          return Promise.reject(error);
        }
      );
    }
  }

  async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axios.request<T>(config);

      return response.data;
    } catch (error) {
      throw this.toHttpError(error, config);
    }
  }

  get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>({ ...options, url, method: 'GET' });
  }

  delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>({ ...options, url, method: 'DELETE' });
  }

  post<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>({ ...options, url, data, method: 'POST' });
  }

  put<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>({ ...options, url, data, method: 'PUT' });
  }

  patch<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>({ ...options, url, data, method: 'PATCH' });
  }

  private describe(config: InternalAxiosRequestConfig, outcome: string): string {
    const started = startedAt.get(config);
    const took = started === undefined ? '' : ` in ${(now() - started).toFixed(0)}ms`;

    return `${config.method?.toUpperCase()} ${this.axios.getUri(config)} → ${outcome}${took}`;
  }

  private toHttpError(error: unknown, config: AxiosRequestConfig): HttpError {
    const url = this.axios.getUri(config);

    if (isAxiosError(error)) {
      const status = error.response?.status;
      const reason = status ? `failed with ${status}` : `failed: ${error.message}`;

      return new HttpError(
        this.name,
        url,
        `[${this.name}] ${config.method} ${url} ${reason}`,
        status,
        error.code
      );
    }

    return new HttpError(this.name, url, `[${this.name}] ${String(error)}`);
  }
}
