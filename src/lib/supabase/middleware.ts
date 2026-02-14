import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const hostname = request.headers.get('host') || ''

    // Determine cookie domain strategy
    // We strictly use HostOnly cookies (undefined domain) to prevent session sharing across subdomains

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }: { name: string, value: string, options: any }) => {
                        request.cookies.set(name, value)
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }: { name: string, value: string, options: any }) => {
                        // Prepare updated options - enforce host only by NOT setting domain
                        const updatedOptions = {
                            ...options,
                            path: '/',
                        }

                        // Remove domain if present to ensure it is HostOnly
                        delete updatedOptions.domain;

                        response.cookies.set(name, value, updatedOptions)
                    })
                },
            },
            cookieOptions: {
                path: '/',
                // strictly no domain set to ensure HostOnly
            }
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    return response
}
