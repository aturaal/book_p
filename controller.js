const express = require('express');
const database = require('./database');
const {verifyEitherJWT , verifySuperadminJWT, verifyjwt} = require('./admin-panel/login')
const router2 = express.Router();

router2.post('/postbook', [verifySuperadminJWT], async (req, res) => {
  try {
    const books = req.body;
    if (!Array.isArray(books))  res.status(400).send({ error: 'Input must be an array.' });
    await database.transaction(async (trx) => await trx.batchInsert('books', books));
     res
     .status(201).send({ message: 'Books added.' });
  } catch (err) {
    console.error(err);
     res
     .status(400).send({ error: 'Error adding books.' });
  }
});

router2.delete('/delete/:isbn', [verifySuperadminJWT], async (req, res) => {
  try {
    const { isbn } = req.params;
    await database('books').where({ ISBN: isbn }).delete();
     res
     .send('Book deleted');
  } catch (err) {
    console.error(err);
     res
     .status(400).send({ error: 'Error deleting book.' });
  }
});

router2.get('/find/:isbn', [verifyEitherJWT], async (req, res) => {
  try {
    const { isbn } = req.params;
    const book = await database('books').where({ ISBN: isbn }).first();
     res
     .send(book);
  } catch (err) {
    console.error(err);
     res
     .status(400).send({ error: 'Error finding book.' });
  }
});

router2.put('/update/:isbn', [verifySuperadminJWT], async (req, res) => {
  try {
    const { isbn } = req.params;
    const { Bookname, Author, avail, rentedby } = req.body;
    await database('books').where({ ISBN: isbn }).update({ Bookname, Author, avail, rentedby });
     res
     .send(await database.select().from('books'));
  } catch (err) {
    console.error(err);
     res
     .status(500).send({ error: 'Error updating book.' });
  }
});

router2.get('/available', [verifyEitherJWT], async (req, res) => {
  try {
    const books = await database('books').select('Bookname', 'Author', 'ISBN', 'avail').where({ avail: 'Y' });
     res
     .status(200).send(books);
  } catch (err) {
    console.error(err);
     res
     .status(500).send({ error: 'Error getting books.' });
  }
});

// Rent a book -> user
router2.put("/rentbook/:isbn", [verifyEitherJWT], async (req, res) => {
  console.log(req.body)
  try {
    const { isbn } = req.params;
    const { rentedby } = req.body;

    // Check if book is available
    const book = await database("books")
      .where({ ISBN: isbn })
      .select("avail")
      .first();
    if (book.avail === "N") {
       res.status(400).send({ error: "Book already rented" });
    }

    // Update book to rented
    const rentedbook = await database("books")
      .where({ ISBN: isbn })
      .update({ avail: "N", rentedby });

    res
    .status(200).send({ rentedbook });
  } catch (error) {
    res
    .status(500).send({ error });
    console.log(error)
  }
});

// Return a book -> admin/user
router2.put("/returnbook/:isbn", [verifyEitherJWT], async (req, res) => {
  try {
    const { isbn } = req.params;

    // Check if book is rented
    const book = await database("books")
      .where({ ISBN: isbn })
      .select("avail")
      .first();

    if (book.avail === "Y") {
      res
      .status(400).send({ error: "Book is already available" });
    }

    // Update book to available
    const returnedbook = await database("books")
      .where({ ISBN: isbn })
      .update({ avail: "Y", rentedby: null });

    res
    .status(200).send({ returnedbook });
  } catch (error) {
    res
    .status(500).send({ error });
  }
});

module.exports = router2;






