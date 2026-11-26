const { getConnection } = require('../config/db');

async function addCustodyRecord({
  itemId,
  officerId,
  fromLocation,
  toLocation,
  notes,
}) {
  let conn;

  try {
    conn = await getConnection();

    await conn.execute(
      `BEGIN
         SP_ADD_CUSTODY_RECORD(
           :itemId,
           :officerId,
           :fromLocation,
           :toLocation,
           :notes
         );
       END;`,
      {
        itemId,
        officerId,
        fromLocation,
        toLocation,
        notes: notes || null,
      }
    );

    await conn.commit();

    return { message: 'Catatan custody berhasil ditambahkan.' };
  } catch (err) {
    if (conn) {
      await conn.rollback();
    }

    throw err;
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

module.exports = { addCustodyRecord };