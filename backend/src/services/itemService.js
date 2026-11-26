const bcrypt = require('bcryptjs');
const { getConnection } = require('../config/db');

async function getCategories() {
  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(
      `SELECT CATEGORY_ID, CATEGORY_NAME
       FROM CATEGORIES
       ORDER BY CATEGORY_ID`
    );

    return result.rows;
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

async function getItems() {
  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(
      `SELECT *
       FROM VW_ITEM_CATALOG
       ORDER BY ITEM_ID DESC`
    );

    return result.rows;
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

async function reportItem(data, userId) {
  let conn;

  try {
    conn = await getConnection();

    const hashedAnswer = await bcrypt.hash(data.secretAnswer, 12);

    await conn.execute(
      `INSERT INTO ITEMS (
        USER_ID,
        CATEGORY_ID,
        ITEM_NAME,
        DESCRIPTION,
        SECRET_QUESTION,
        SECRET_ANSWER_HASH,
        PHOTO,
        LOCATION_FOUND,
        DATE_FOUND,
        STATUS
      ) VALUES (
        :userId,
        :categoryId,
        :itemName,
        :description,
        :secretQuestion,
        :hashedAnswer,
        :photo,
        :locationFound,
        TO_DATE(:dateFound, 'YYYY-MM-DD'),
        'ACTIVE'
      )`,
      {
        userId,
        categoryId: data.categoryId,
        itemName: data.itemName,
        description: data.description || null,
        secretQuestion: data.secretQuestion,
        hashedAnswer,
        photo: data.photo || null,
        locationFound: data.locationFound,
        dateFound: data.dateFound,
      }
    );

    await conn.commit();

    return { message: 'Laporan barang berhasil ditambahkan.' };
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

module.exports = {
  getCategories,
  getItems,
  reportItem,
};