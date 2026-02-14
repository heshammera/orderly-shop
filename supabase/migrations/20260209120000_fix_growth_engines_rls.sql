-- Allow Store Owners to MANAGE (Insert/Update/Delete) Loyalty Points
create policy "Store owners can manage loyalty points"
    on public.loyalty_points for all
    using (exists (
        select 1 from public.store_members
        where store_members.store_id = loyalty_points.store_id
        and store_members.user_id = auth.uid()
        and store_members.role in ('owner', 'admin')
    ));

-- Allow Store Owners/System to MANAGE Loyalty Transactions
create policy "Store owners can manage loyalty transactions"
    on public.loyalty_transactions for all
    using (exists (
        select 1 from public.loyalty_points
        join public.store_members on store_members.store_id = loyalty_points.store_id
        where loyalty_points.id = loyalty_transactions.loyalty_id
        and store_members.user_id = auth.uid()
        and store_members.role in ('owner', 'admin')
    ));

-- Allow Store Owners to MANAGE Affiliate Conversions (e.g. mark as paid)
create policy "Store owners can manage affiliate conversions"
    on public.affiliate_conversions for all
    using (exists (
        select 1 from public.affiliates
        join public.store_members on store_members.store_id = affiliates.store_id
        where affiliates.id = affiliate_conversions.affiliate_id
        and store_members.user_id = auth.uid()
        and store_members.role in ('owner', 'admin')
    ));
