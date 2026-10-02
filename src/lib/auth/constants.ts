/** Where /auth/callback sends the user after a sign-in started from the
 * Track Subscriptions entry points. Carried in a short-lived cookie rather
 * than a ?next= on redirectTo: Supabase only redirects back to URLs on its
 * allow list, and an unlisted query-string variant would silently fall
 * back to the Site URL and break sign-in entirely. Kept in its own file so
 * the server callback route can import it without pulling in the browser
 * Supabase client. */
export const POST_SIGNIN_COOKIE = "submynt_post_signin";
export const POST_SIGNIN_TARGET = "/my-subscriptions";
