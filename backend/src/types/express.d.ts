import 'express-serve-static-core';
import { ReqUser } from './auth';

declare module 'express-serve-static-core' {
  interface Request {
    user?: ReqUser;
  }
}
