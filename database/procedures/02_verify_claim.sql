CREATE OR REPLACE PROCEDURE SP_VERIFY_CLAIM (
    p_claim_id IN NUMBER,
    p_is_correct IN NUMBER
)
IS
    v_attempt_count NUMBER;
    v_claim_status CLAIMS.CLAIM_STATUS%TYPE;
BEGIN
    IF p_is_correct NOT IN (0, 1) THEN
        RAISE_APPLICATION_ERROR(
            -20004,
            'Hasil verifikasi tidak valid.'
        );
    END IF;

    SELECT attempt_count, claim_status
    INTO v_attempt_count, v_claim_status
    FROM CLAIMS
    WHERE claim_id = p_claim_id
    FOR UPDATE;

    IF v_claim_status <> 'PENDING' THEN
        RAISE_APPLICATION_ERROR(
            -20005,
            'Klaim tidak dapat diverifikasi.'
        );
    END IF;

    IF p_is_correct = 1 THEN
        UPDATE CLAIMS
        SET claim_status = 'VERIFIED',
            attempt_count = attempt_count + 1
        WHERE claim_id = p_claim_id;
    ELSE
        UPDATE CLAIMS
        SET attempt_count = attempt_count + 1,
            claim_status = CASE
                WHEN attempt_count + 1 >= 3 THEN 'REJECTED'
                ELSE 'PENDING'
            END
        WHERE claim_id = p_claim_id;
    END IF;
END;
/