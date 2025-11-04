import 'express-serve-static-core';
import { ReqUser } from './auth.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: ReqUser;
  }
}
