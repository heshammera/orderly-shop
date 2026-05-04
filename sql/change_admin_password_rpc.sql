CREATE OR REPLACE FUNCTION admin_change_password(
    p_admin_id UUID,
    p_new_password TEXT
)
RETURNS JSON AS $$
BEGIN
    UPDATE super_admins
    SET 
        password_hash = crypt(p_new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = p_admin_id;

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
