import { AxiosError } from 'axios';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';

/**
 * An axios adapter answering every request with `body` and `status` — pass it as the `adapter`
 * option of a client to test code without a network. Calls are recorded on `adapter.calls`.
 */
export const mockAdapter = (body: unknown, status = 200) => {
  const calls: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    calls.push(config);

    const response = { data: body, status, statusText: '', headers: {}, config };

    if (status >= 400) {
      throw new AxiosError(
        `Request failed with status code ${status}`,
        AxiosError.ERR_BAD_REQUEST,
        config,
        null,
        response
      );
    }

    return response;
  };

  return Object.assign(adapter, { calls });
};
