-- RLS policies for plan_features and plan_feature_values to allow Super Admins to manage them

-- Policy for inserting into plan_features
CREATE POLICY "Enable insert for authenticated users only" ON plan_features
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy for updating plan_features
CREATE POLICY "Enable update for authenticated users only" ON plan_features
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy for deleting from plan_features
CREATE POLICY "Enable delete for authenticated users only" ON plan_features
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Policy for inserting into plan_feature_values
CREATE POLICY "Enable insert for authenticated users only" ON plan_feature_values
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy for updating plan_feature_values
CREATE POLICY "Enable update for authenticated users only" ON plan_feature_values
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy for deleting from plan_feature_values
CREATE POLICY "Enable delete for authenticated users only" ON plan_feature_values
    FOR DELETE
    USING (auth.role() = 'authenticated');
