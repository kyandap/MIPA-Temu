CREATE OR REPLACE PROCEDURE SP_REJECT_CLAIM (
    p_claim_id IN NUMBER
)
IS
    v_claim_status CLAIMS.CLAIM_STATUS%TYPE;
BEGIN
    SELECT claim_status
    INTO v_claim_status
    FROM CLAIMS
    WHERE claim_id = p_claim_id
    FOR UPDATE;

    IF v_claim_status NOT IN ('PENDING', 'VERIFIED') THEN
        RAISE_APPLICATION_ERROR(
            -20008,
            'Klaim tidak dapat ditolak.'
        );
    END IF;

    UPDATE CLAIMS
    SET claim_status = 'REJECTED'
    WHERE claim_id = p_claim_id;
END;
/