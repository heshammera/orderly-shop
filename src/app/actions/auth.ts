"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function checkEmailExists(email: string) {
    try {
        const supabaseAdmin = createAdminClient();

        // We use listUsers to search by email. 
        // Note: getUserById requires a UID, so listUsers is the way to query by email via Admin API.
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 1,
            // @ts-ignore - 'filters' might not be fully typed in some SDK versions, or query params logic
            // Actually, currently listUsers doesn't support direct email filtering in all versions easily without returning all users.
            // BETTER APPROACH for older/standard SDK: 
            // Attempt to create a user with a dummy password? NO.
            // Attempt to get user by email is not directly exposed in admin for 'read' without ID.
            // WAIT: admin.listUsers() doesn't filter by email server-side in all versions efficiently.

            // ALTERNATIVE: Use the RPC or Database query if we have access to auth schema (usually we don't directly from client SDK).
            // BUT: createAdminClient gives us service_role. 
            // In many Supabase setups, we can use `supabaseAdmin.from('auth.users').select('*').eq('email', email)` is NOT possible via JS SDK direct client unless we expose it.

            // CORRECTION: standard pattern is to try to Invite or use getUser (if we had ID). 
            // Let's use `listUsers` generic search if available or iterate? No, that's bad.

            // There IS `supabaseAdmin.rpc('function_name')` if we have one.
            // Or `supabaseAdmin.auth.admin.getUserByEmail(email)` -> Wait, looking at docs...
            // It seems `createUser` or `inviteUserByEmail` are options. 

            // Let's use `listUsers` if the project size allows, but 'Generate Link' or 'Invite' is weird.
            // Actually, Supabase Admin API *does* not have a simple "does email exist" without side effects or listing.

            // Standard workaround for "Check if email exists" without logging in:
            // 1. Attempt Initialize Resend (Rate Limits?)
            // 2. Client Side: just let `signUp` fail? Supabase `signUp` *should* return meaningful error if email validation fails or dupes?
            // User says: "It accepts registration normally". 
            // This implies `signUp` returns success but maybe sends a "Magic Link" to the OLD user? 
            // If email confirmation is ON, Supabase returns fake success for security (User Enumeration Protection).

            // TO FIX: We *must* use Admin to check explicitly if we want to break User Enumeration Protection for UX.
            // `listUsers` does not filter by email.

            // Let's try to query the `public.profiles` or `public.users` if we have a view?
            // Usually `profiles` is public/accessible.
        });

        // BETTER PATH: Query `public.profiles` table (assuming it syncs 1-to-1 with auth.users)
        // We have `public.profiles`. Let's check there.
        // But `profiles` might be empty if registration failed halfway?
        // Safest is Admin Client -> from('params')? No.

        // Re-reading Supabase Admin SDK types...
        // modern supabase-js has `listUsers` but no email filter.

        // Let's use a standard query on `profiles` table using Admin Client (bypassing RLS)
        const { data: profiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email) // Assuming we store email in profiles? 
        // Wait, looking at migrations... `20260213170000_fix_signup_trigger.sql`
        // `INSERT INTO public.profiles (user_id, full_name)...` 
        // It does NOT insert email into profiles.

        // So we can't check profiles.

        // Okay, let's use the SCARY but effective method: `admin.createUser` and catch error? 
        // No, that creates a user. 

        // Let's use `supabaseAdmin.auth.admin.listUsers()` ?
        // Actually, older versions supported filtering. 
        // New version: List is paginated.

        // Correct solution for "Check if email exists" in Supabase to prevent "Fake Success":
        // We MUST rely on `signUp` returning specific error provided `config.mailer.autaconfirm` is off?
        // User says: "When I register with an existing email, it accepts it normally".
        // This is Supabase default security behavior (Security by Obscurity).

        // If the user *wants* to show "Email already exists", we MUST use Admin.
        // Since we are in a server action, it is safe-ish.

        // WORKAROUND: `supabaseAdmin.rpc` to a custom function `check_email_exists`?
        // OR: `supabaseAdmin.from('users_readonly_view')...` if we had one?

        // Let's use `supabaseAdmin.auth.admin.listUsers()` with a hack? 
        // No, let's try `supabaseAdmin.rpc('get_user_id_by_email', { email })`? 
        // We don't have that RPC.

        // Wait! `listUsers` DOES support partial match? No.

        // OK, I will assume we can query `auth.users` via a direct SQL query? No, standard client.

        // Let's look at `supabase/admin.ts`.
        // If I can't easily check auth.users, I'm stuck.

        // WAIT. I can use `createUser` with a dummy password. 
        // If valid -> rollback (delete)? No, side effects.

        // Let's go with the `profiles` table approach BUT I need to know if we store email.
        // Migration `20260213170000_fix_signup_trigger.sql` does NOT add email.

        // Let's check `src/hooks/useAuth.ts` again. 

        // Do we have *any* table with emails? 
        // `store_members`? No.

        // I will add a new RPC `check_email_exists` that checks `auth.users` since we have Database access.
        // This is the cleanest and most robust way.

        // BUT I can't easily run SQL from here without the tool.
        // I will add the RPC via a migration file first? 
        // I can write to `src/app/actions/auth.ts` now, but it won't work without the RPC.

        // PLAN UPDATE: 
        // 1. Create RPC `check_user_email` in a new migration.
        // 2. Call it from server action.

        // For now, I will write the Server Action assuming the RPC exists, 
        // then I'll create the SQL file.

        const { data: userExists, error: rpcError } = await supabaseAdmin
            .rpc('check_email_exists', { p_email: email });

        if (rpcError) {
            // If RPC is missing, fallback or log
            console.error("RPC check_email_exists failed:", rpcError);
            return { exists: false, error: "Server check failed" };
        }

        return { exists: !!userExists };

    } catch (error) {
        console.error("Check email error:", error);
        return { exists: false, error: "Unknown error" };
    }
}
