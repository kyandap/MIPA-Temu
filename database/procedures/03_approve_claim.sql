CREATE OR REPLACE PROCEDURE SP_APPROVE_CLAIM (
    p_claim_id IN NUMBER
)
IS
    v_item_id CLAIMS.ITEM_ID%TYPE;
    v_claim_status CLAIMS.CLAIM_STATUS%TYPE;
    v_item_status ITEMS.STATUS%TYPE;
BEGIN
    -- Ambil data klaim dan kunci barisnya
    SELECT item_id, claim_status
    INTO v_item_id, v_claim_status
    FROM CLAIMS
    WHERE claim_id = p_claim_id
    FOR UPDATE;

    IF v_claim_status <> 'VERIFIED' THEN
        RAISE_APPLICATION_ERROR(
            -20006,
            'Klaim belum berhasil diverifikasi.'
        );
    END IF;

    -- Kunci barang agar tidak disetujui oleh dua klaim
    SELECT status
    INTO v_item_status
    FROM ITEMS
    WHERE item_id = v_item_id
    FOR UPDATE;

    IF v_item_status NOT IN ('ACTIVE', 'IN_CUSTODY') THEN
        RAISE_APPLICATION_ERROR(
            -20007,
            'Barang sudah tidak tersedia.'
        );
    END IF;

    -- Setujui klaim
    UPDATE CLAIMS
    SET claim_status = 'APPROVED'
    WHERE claim_id = p_claim_id;

    -- Perbarui status barang
    UPDATE ITEMS
    SET status = 'CLAIM_APPROVED'
    WHERE item_id = v_item_id;

    -- Tolak klaim lain untuk barang yang sama
    UPDATE CLAIMS
    SET claim_status = 'REJECTED'
    WHERE item_id = v_item_id
      AND claim_id <> p_claim_id
      AND claim_status IN ('PENDING', 'VERIFIED');

END;
/