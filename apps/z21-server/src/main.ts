/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Bootstrap } from './bootstrap/bootstrap';

const app = new Bootstrap().start();
process.on('SIGINT', () => app.stop());
process.on('SIGTERM', () => app.stop());
