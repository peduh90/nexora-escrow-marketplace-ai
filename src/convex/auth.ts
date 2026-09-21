// THIS FILE IS READ ONLY. Do not touch this file unless you are correctly adding a new auth provider in accordance to the vly auth documentation

import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import Google from "@auth/core/providers/google";
import { emailOtp } from "./auth/emailOtp";


export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // Credentials are passed explicitly (the documented @auth/core pattern) so
    // provider materialization does not depend on module-load-time env
    // injection — relying on AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET being auto-read
    // broke whenever the module had been materialized before the env vars
    // were set (the signin endpoint then crashed with HTTP 500).
    Google({
      clientId: (process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID)!,
      clientSecret: (process.env.AUTH_GOOGLE_SECRET ??
        process.env.GOOGLE_CLIENT_SECRET)!,
    }),
    emailOtp,
    Anonymous,
  ],
});