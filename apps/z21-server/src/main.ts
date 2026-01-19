/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Bootstrap } from './bootstrap/bootstrap';
import { createProviders } from './bootstrap/providers';

const providers = createProviders();
const app = new Bootstrap(providers).start();
process.on('SIGINT', () => app.stop());
process.on('SIGTERM', () => app.stop());
