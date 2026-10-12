import { describe, expect, it } from 'vitest';
import { AxiosError } from 'axios';
import { createApp, provide } from '@/core';
import { CommonModule } from '../CommonModule';
import { HttpError } from './HttpClient';
import { createHttpClient, HttpModule } from './HttpModule';
import { mockAdapter } from './testing';
import {
  HTTP_CLIENT_DEFAULTS_TOKEN,
  HTTP_CLIENT_FACTORY_TOKEN,
  HTTP_CLIENT_OPTIONS_TOKEN,
  HTTP_CLIENT_TOKEN,
} from './tokens';

describe('HttpModule', () => {
  it('provides a default client configured through HTTP_CLIENT_OPTIONS_TOKEN', async () => {
    const adapter = mockAdapter({ ok: true });
    const app = createApp({
      name: 'test',
      modules: [CommonModule, HttpModule],
      providers: [
        provide({
          provide: HTTP_CLIENT_OPTIONS_TOKEN,
          useValue: { baseURL: 'https://api.test', adapter },
        }),
      ],
    });
    const client = app.fork().get(HTTP_CLIENT_TOKEN);

    expect(client.name).toBe('default');
    await expect(client.get('/ping', { params: { a: 1 } })).resolves.toEqual({ ok: true });
    expect(client.axios.getUri(adapter.calls[0])).toBe('https://api.test/ping?a=1');
  });

  it('creates named clients that merge shared defaults with their own axios options', async () => {
    const adapter = mockAdapter([]);
    const app = createApp({
      name: 'test',
      modules: [CommonModule, HttpModule],
      providers: [
        provide({
          provide: HTTP_CLIENT_DEFAULTS_TOKEN,
          useValue: { timeout: 1_000, headers: { 'X-App': 'census' } },
        }),
      ],
    });
    const factory = app.fork().get(HTTP_CLIENT_FACTORY_TOKEN);
    const client = factory({
      name: 'catalogue',
      baseURL: 'https://catalogue.test',
      headers: { 'X-Client': 'catalogue' },
      adapter,
    });

    await client.post('/items', { id: 1 });

    const [config] = adapter.calls;

    expect(client.name).toBe('catalogue');
    expect(config?.timeout).toBe(1_000);
    expect(config?.headers.get('X-App')).toBe('census');
    expect(config?.headers.get('X-Client')).toBe('catalogue');
    expect(config?.headers.get('Accept')).toBe('application/json');
    expect(config?.method).toBe('post');
    expect(config?.data).toBe('{"id":1}');
  });
});

describe('HttpClient errors', () => {
  it('rejects with HttpError carrying the client name and status', async () => {
    const client = createHttpClient({
      name: 'api',
      baseURL: 'https://api.test',
      adapter: mockAdapter({ error: 'nope' }, 404),
    });

    const error = await client.get('/missing').catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ client: 'api', status: 404, url: 'https://api.test/missing' });
  });

  it('leaves status empty for network failures, so they count as retryable', async () => {
    const client = createHttpClient({
      name: 'api',
      adapter: async (config) => {
        throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
      },
    });

    await expect(client.get('/x')).rejects.toMatchObject({
      status: undefined,
      code: 'ERR_NETWORK',
    });
  });
});
