import { Router } from 'express';
import { consultarSesion, login } from './auth.controller.js';

export const rutasAuth = Router();

rutasAuth.post('/login', login);
rutasAuth.get(['/session', '/sesion'], consultarSesion);
