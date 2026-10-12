import { app } from '@/index';
import { createAppRouter } from '@/modules/router';
import { routeTree } from './routeTree.gen';

/**
 * TanStack Start entry: called once per server request and once in the browser. Forks a request
 * container from `app`, runs the lifecycle and returns the router bound to that container.
 */
export const getRouter = () => createAppRouter(app, routeTree);
