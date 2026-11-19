CREATE OR REPLACE PROCEDURE SP_SUBMIT_CLAIM (
    p_item_id IN NUMBER,
    p_user_id IN NUMBER
)
IS
    v_status ITEMS.STATUS%TYPE;
    v_finder_id ITEMS.USER_ID%TYPE;
    v_pending_count NUMBER;
BEGIN
    SELECT status, user_id
    INTO v_status, v_finder_id
    FROM ITEMS
    WHERE item_id = p_item_id
    FOR UPDATE;

    IF v_status NOT IN ('ACTIVE', 'IN_CUSTODY') THEN
        RAISE_APPLICATION_ERROR(
            -20001,
            'Barang tidak tersedia untuk diklaim.'
        );
    END IF;

    IF v_finder_id = p_user_id THEN
        RAISE_APPLICATION_ERROR(
            -20002,
            'Penemu tidak dapat mengklaim barang sendiri.'
        );
    END IF;

    SELECT COUNT(*)
    INTO v_pending_count
    FROM CLAIMS
    WHERE item_id = p_item_id
      AND user_id = p_user_id
      AND claim_status = 'PENDING';

    IF v_pending_count > 0 THEN
        RAISE_APPLICATION_ERROR(
            -20003,
            'Anda masih memiliki pengajuan klaim yang pending.'
        );
    END IF;

    INSERT INTO CLAIMS (
        item_id,
        user_id,
        claim_status,
        attempt_count
    )
    VALUES (
        p_item_id,
        p_user_id,
        'PENDING',
        0
    );

END;
/