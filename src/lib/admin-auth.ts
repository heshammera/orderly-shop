import { cookies } from 'next/headers'

const ADMIN_SESSION_COOKIE = 'admin_session_token'

export async function setAdminSession(token: string, expiresAt: string) {
    const cookieStore = cookies()
    // Ensure strict cookie security
    cookieStore.set(ADMIN_SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: new Date(expiresAt),
    })
}

export async function getAdminSessionToken() {
    const cookieStore = cookies()
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)
    return token?.value
}

export async function deleteAdminSession() {
    const cookieStore = cookies()
    cookieStore.delete(ADMIN_SESSION_COOKIE)
}
