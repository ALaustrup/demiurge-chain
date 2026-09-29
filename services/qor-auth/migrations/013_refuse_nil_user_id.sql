-- 013: No account and no audit row can use the nil user id.
--
-- The admin ban handler wrote its audit row under 00000000-0000-0000-0000-000000000000
-- as a placeholder actor. The handler now takes the administrator's id from the
-- access token. These constraints make a placeholder actor impossible to store,
-- not merely unused: an audit row cannot name the nil id, and no account can have
-- it, so a foreign key can never quietly accept it either.

ALTER TABLE users
    ADD CONSTRAINT users_id_not_nil
    CHECK (id <> '00000000-0000-0000-0000-000000000000'::uuid);

ALTER TABLE audit_log
    ADD CONSTRAINT audit_log_user_id_not_nil
    CHECK (user_id IS NULL OR user_id <> '00000000-0000-0000-0000-000000000000'::uuid);
