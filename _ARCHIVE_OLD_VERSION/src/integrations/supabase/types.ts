export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            cart_items: {
                Row: {
                    cart_id: string
                    created_at: string
                    id: string
                    product_id: string
                    quantity: number
                    variant_id: string | null
                }
                Insert: {
                    cart_id: string
                    created_at?: string
                    id?: string
                    product_id: string
                    quantity?: number
                    variant_id?: string | null
                }
                Update: {
                    cart_id?: string
                    created_at?: string
                    id?: string
                    product_id?: string
                    quantity?: number
                    variant_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "cart_items_cart_id_fkey"
                        columns: ["cart_id"]
                        isOneToOne: false
                        referencedRelation: "carts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "cart_items_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    }
                ]
            }
            carts: {
                Row: {
                    created_at: string
                    id: string
                    store_id: string
                    updated_at: string
                    user_id: string | null
                }
                Insert: {
                    created_at?: string
                    id?: string
                    store_id: string
                    updated_at?: string
                    user_id?: string | null
                }
                Update: {
                    created_at?: string
                    id?: string
                    store_id?: string
                    updated_at?: string
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "carts_store_id_fkey"
                        columns: ["store_id"]
                        isOneToOne: false
                        referencedRelation: "stores"
                        referencedColumns: ["id"]
                    }
                ]
            }
            categories: {
                Row: {
                    created_at: string
                    description: Json
                    id: string
                    image_url: string
                    name: Json
                    parent_id: string
                    sort_order: number
                    status: string
                    store_id: string
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    description?: Json
                    id?: string
                    image_url?: string
                    name: Json
                    parent_id?: string
                    sort_order?: number
                    status?: string
                    store_id: string
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    description?: Json
                    id?: string
                    image_url?: string
                    name?: Json
                    parent_id?: string
                    sort_order?: number
                    status?: string
                    store_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "categories_store_id_fkey"
                        columns: ["store_id"]
                        isOneToOne: false
                        referencedRelation: "stores"
                        referencedColumns: ["id"]
                    }
                ]
            }
            coupons: {
                Row: {
                    code: string
                    created_at: string
                    discount_type: string
                    discount_value: number
                    expires_at: string | null
                    id: string
                    is_active: boolean
                    max_uses: number | null
                    min_purchase: number | null
                    store_id: string
                    times_used: number
                    updated_at: string
                }
                Insert: {
                    code: string
                    created_at?: string
                    discount_type: string
                    discount_value: number
                    expires_at?: string | null
                    id?: string
                    is_active?: boolean
                    max_uses?: number | null
                    min_purchase?: number | null
                    store_id: string
                    times_used?: number
                    updated_at?: string
                }
                Update: {
                    code?: string
                    created_at?: string
                    discount_type?: string
                    discount_value?: number
                    expires_at?: string | null
                    id?: string
                    is_active?: boolean
                    max_uses?: number | null
                    min_purchase?: number | null
                    store_id?: string
                    times_used?: number
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "coupons_store_id_fkey"
                        columns: ["store_id"]
                        isOneToOne: false
                        referencedRelation: "stores"
                        referencedColumns: ["id"]
                    }
                ]
            }
            customers: {
                Row: {
                    created_at: string
                    email: string
                    id: string
                    name: string
                    phone: string
                    store_id: string
                }
                Insert: {
                    created_at?: string
                    email: string
                    id?: string
                    name: string
                    phone: string
                    store_id: string
                }
                Update: {
                    created_at?: string
                    email?: string
                    id?: string
                    name?: string
                    phone?: string
                    store_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "customers_store_id_fkey"
                        columns: ["store_id"]
                        isOneToOne: false
                        referencedRelation: "stores"
                        referencedColumns: ["id"]
                    }
                ]
            }
            order_items: {
                Row: {
                    created_at: string
                    id: string
                    order_id: string
                    product_id: string
                    quantity: number
                    total_price: number
                    unit_price: number
                }
                Insert: {
                    created_at?: string
                    id?: string
                    order_id: string
                    product_id: string
                    quantity: number
                    total_price: number
                    unit_price: number
                }
                Update: {
                    created_at?: string
                    id?: string
                    order_id?: string
                    product_id?: string
                    quantity?: number
                    total_price?: number
                    unit_price?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "order_items_order_id_fkey"
                        columns: ["order_id"]
                        isOneToOne: false
                        referencedRelation: "orders"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "order_items_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    }
                ]
            }
            orders: {
                Row: {
                    city: string
                    created_at: string
                    customer_email: string
                    customer_name: string
                    customer_phone: string
                    customer_phone_alt: string | null
                    discount_amount: number
                    id: string
                    notes: string | null
                    order_number: string
                    shipping_address: string
                    shipping_cost: number
                    status: string
                    store_id: string
                    subtotal: number
                    total: number
                    updated_at: string
                }
                Insert: {
                    city: string
                    created_at?: string
                    customer_email: string
                    customer_name: string
                    customer_phone: string
                    customer_phone_alt?: string | null
                    discount_amount?: number
                    id?: string
                    notes?: string | null
                    order_number: string
                    shipping_address: string
                    shipping_cost?: number
                    status?: string
                    store_id: string
                    subtotal: number
                    total: number
                    updated_at?: string
                }
                Update: {
                    city?: string
                    created_at?: string
                    customer_email?: string
                    customer_name?: string
                    customer_phone?: string
                    customer_phone_alt?: string | null
                    discount_amount?: number
                    id?: string
                    notes?: string | null
                    order_number?: string
                    shipping_address?: string
                    shipping_cost?: number
                    status?: string
                    store_id?: string
                    subtotal?: number
                    total?: number
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "orders_store_id_fkey"
                        columns: ["store_id"]
                        isOneToOne: false
                        referencedRelation: "stores"
                        referencedColumns: ["id"]
                    }
                ]
            }
            product_categories: {
                Row: {
                    category_id: string
                    product_id: string
                }
                Insert: {
                    category_id: string
                    product_id: string
                }
                Update: {
                    category_id?: string
                    product_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "product_categories_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "product_categories_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    }
                ]
            }
            product_variants: {
                Row: {
                    created_at: string
                    id: string
                    price: number
                    product_id: string
                    sku: string | null
                    stock: number
                }
                Insert: {
                    created_at?: string
                    id?: string
                    price: number
                    product_id: string
                    sku?: string | null
                    stock?: number
                }
                Update: {
                    created_at?: string
                    id?: string
                    price?: number
                    product_id?: string
                    sku?: string | null
                    stock?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "product_variants_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    }
                ]
            }
            products: {
                Row: {
                    cost_price: number
                    created_at: string
                    description: Json
                    id: string
                    images: string[]
                    name: Json
                    price: number
                    sale_price: number | null
                    sku: string | null
                    status: string
                    stock: number
                    store_id: string
                    updated_at: string
                }
                Insert: {
                    cost_price?: number
                    created_at?: string
                    description?: Json
                    id?: string
                    images?: string[]
                    name: Json
                    price: number
                    sale_price?: number | null
                    sku?: string | null
                    status?: string
                    stock?: number
                    store_id: string
                    updated_at?: string
                }
                Update: {
                    cost_price?: number
                    created_at?: string
                    description?: Json
                    id?: string
                    images?: string[]
                    name?: Json
                    price?: number
                    sale_price?: number | null
                    sku?: string | null
                    status?: string
                    stock?: number
                    store_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "products_store_id_fkey"
                        columns: ["store_id"]
                        isOneToOne: false
                        referencedRelation: "stores"
                        referencedColumns: ["id"]
                    }
                ]
            }
            profiles: {
                Row: {
                    created_at: string
                    email: string
                    full_name: string | null
                    id: string
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    email: string
                    full_name?: string | null
                    id: string
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    email?: string
                    full_name?: string | null
                    id?: string
                    updated_at?: string
                }
                Relationships: []
            }
            store_integrations: {
                Row: {
                    config: Json
                    created_at: string
                    id: string
                    is_active: boolean
                    provider: string
                    store_id: string
                    updated_at: string
                }
                Insert: {
                    config?: Json
                    created_at?: string
                    id?: string
                    is_active?: boolean
                    provider: string
                    store_id: string
                    updated_at?: string
                }
                Update: {
                    config?: Json
                    created_at?: string
                    id?: string
                    is_active?: boolean
                    provider?: string
                    store_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "store_integrations_store_id_fkey"
                        columns: ["store_id"]
                        isOneToOne: false
                        referencedRelation: "stores"
                        referencedColumns: ["id"]
                    }
                ]
            }
            store_members: {
                Row: {
                    created_at: string
                    id: string
                    role: string
                    store_id: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    role?: string
                    store_id: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    role?: string
                    store_id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "store_members_store_id_fkey"
                        columns: ["store_id"]
                        isOneToOne: false
                        referencedRelation: "stores"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "store_members_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            stores: {
                Row: {
                    balance: number
                    commission_rate: number
                    created_at: string
                    currency: string
                    description: Json
                    id: string
                    logo_url: string | null
                    name: Json
                    owner_id: string
                    settings: Json | null
                    slug: string
                    status: string
                    updated_at: string
                }
                Insert: {
                    balance?: number
                    commission_rate?: number
                    created_at?: string
                    currency?: string
                    description?: Json
                    id?: string
                    logo_url?: string | null
                    name: Json
                    owner_id: string
                    settings?: Json | null
                    slug: string
                    status?: string
                    updated_at?: string
                }
                Update: {
                    balance?: number
                    commission_rate?: number
                    created_at?: string
                    currency?: string
                    description?: Json
                    id?: string
                    logo_url?: string | null
                    name?: Json
                    owner_id?: string
                    settings?: Json | null
                    slug?: string
                    status?: string
                    updated_at?: string
                }
                Relationships: []
            }
            upsell_offers: {
                Row: {
                    created_at: string
                    id: string
                    product_id: string
                    upsell_product_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    product_id: string
                    upsell_product_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    product_id?: string
                    upsell_product_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "upsell_offers_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "upsell_offers_upsell_product_id_fkey"
                        columns: ["upsell_product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    }
                ]
            }
            user_roles: {
                Row: {
                    created_at: string
                    id: string
                    role: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    role: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    role?: string
                    user_id?: string
                }
                Relationships: []
            }
            variant_options: {
                Row: {
                    created_at: string
                    id: string
                    option_name: string
                    option_value: string
                    variant_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    option_name: string
                    option_value: string
                    variant_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    option_name?: string
                    option_value?: string
                    variant_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "variant_options_variant_id_fkey"
                        columns: ["variant_id"]
                        isOneToOne: false
                        referencedRelation: "product_variants"
                        referencedColumns: ["id"]
                    }
                ]
            }
            store_invitations: {
                Row: {
                    created_at: string
                    email: string
                    expires_at: string
                    id: string
                    role: string
                    status: string
                    store_id: string
                    token: string
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    email: string
                    expires_at?: string
                    id?: string
                    role: string
                    status?: string
                    store_id: string
                    token: string
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    email?: string
                    expires_at?: string
                    id?: string
                    role?: string
                    status?: string
                    store_id?: string
                    token?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "store_invitations_store_id_fkey"
                        columns: ["store_id"]
                        isOneToOne: false
                        referencedRelation: "stores"
                        referencedColumns: ["id"]
                    }
                ]
            }
            wallet_recharge_requests: {
                Row: {
                    amount: number
                    created_at: string
                    id: string
                    payment_proof_url: string
                    status: string
                    store_id: string
                    updated_at: string
                }
                Insert: {
                    amount: number
                    created_at?: string
                    id?: string
                    payment_proof_url: string
                    status?: string
                    store_id: string
                    updated_at?: string
                }
                Update: {
                    amount?: number
                    created_at?: string
                    id?: string
                    payment_proof_url?: string
                    status?: string
                    store_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "wallet_recharge_requests_store_id_fkey"
                        columns: ["store_id"]
                        isOneToOne: false
                        referencedRelation: "stores"
                        referencedColumns: ["id"]
                    }
                ]
            }
            wallet_transactions: {
                Row: {
                    amount: number
                    created_at: string
                    description: string
                    id: string
                    reference_id: string
                    store_id: string
                    type: string
                }
                Insert: {
                    amount: number
                    created_at?: string
                    description: string
                    id?: string
                    reference_id: string
                    store_id: string
                    type: string
                }
                Update: {
                    amount?: number
                    created_at?: string
                    description?: string
                    id?: string
                    reference_id?: string
                    store_id?: string
                    type?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "wallet_transactions_store_id_fkey"
                        columns: ["store_id"]
                        isOneToOne: false
                        referencedRelation: "stores"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            lookup_user_by_email: {
                Args: {
                    search_email: string
                }
                Returns: {
                    id: string
                    email: string
                    full_name: string
                }[]
            },
            get_store_team: {
                Args: {
                    p_store_id: string
                }
                Returns: {
                    member_id: string
                    user_id: string
                    role: string
                    email: string
                    full_name: string
                    joined_at: string
                }[]
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
