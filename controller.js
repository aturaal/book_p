const express = require('express');
const database = require('./database');
const {verifyEitherJWT , verifySuperadminJWT, verifyjwt} = require('./admin-panel/login')

const controller = express.Router();

//post a book -> admin
controller.post('/postbook', [verifySuperadminJWT], async (req, res) => {
  try {
    const books = req.body;
    if (!Array.isArray(books)) {
      return res.status(400).send({ error: 'Input must be an array.' });
    }
    await database.transaction(async (trx) => {
      await trx.batchInsert('books', books);
    });
    return res.status(201).send({ message: 'Books added.' });
  } catch (err) {
    console.error(err);
    return res.status(400).send({ error: 'Error adding books.' });
  }
});

//delete a book -> admin
controller.delete('/delete/:isbn', [verifySuperadminJWT], async (req, res) => {
  try {
    const { isbn } = req.params;
    const deletedbook = await database('books')
      .where({ ISBN: isbn })
      .delete();
    return res.send('Book successfully deleted');
  } catch (err) {
    console.error(err);
    return res.status(400).send({ error: 'Error deleting book.' });
  }
});

//find a book -> admin/user
controller.get('/find/:isbn', [verifyEitherJWT], async (req, res) => {
  try {
    const { isbn } = req.params;
    const book = await database('books')
      .where({ ISBN: isbn })
      .first();
    return res.send(book);
  } catch (err) {
    console.error(err);
    return res.status(400).send({ error: 'Error finding book.' });
  }
});

//edit a book -> admin
controller.put('/editbook/:isbn', [verifySuperadminJWT], async (req, res) => {
  try {
    const { isbn } = req.params;
    const { Bookname, Author, avail, rentedby } = req.body;
    await database('books')
      .where({ ISBN: isbn })
      .update({ Bookname, Author, avail, rentedby });
    const books = await database.select().from('books');
    return res.send(books);
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: 'Error updating book.' });
  }
});

controller.get('/availablebooks', [verifyEitherJWT], async (req, res) => {
  try {
    const books = await database('books')
      .select('Bookname', 'Author', 'ISBN', 'avail')
      .where({ avail: 'Y' });
    return res.status(200).send(books);
  } catch (error) {
    return res.status(500).send({ error: 'Error fetching books' });
  }
});



// Rent a book -> user
controller.put("/rentbook/:isbn", [verifyEitherJWT], async (req, res) => {
  try {
    const { isbn } = req.params;
    const { rentedby } = req.body;

    // check if the book is already rented
    const book = await database("books")
      .where({ ISBN: isbn })
      .select("avail")
      .first();

    if (book.avail === "N") {
      return res.status(400).send({ error: "Book already rented" });
    }

    // update the book to rented
    const rentedbook = await database("books")
      .where({ ISBN: isbn })
      .update({ avail: "N", rentedby });

    res.status(200).send({ rentedbook });
  } catch (error) {
    res.status(500).send({ error });
  }
});

// Return a book -> admin/user
controller.put("/returnbook/:isbn", [verifyEitherJWT], async (req, res) => {
  try {
    const { isbn } = req.params;

    // check if the book is already available
    const book = await database("books")
      .where({ ISBN: isbn })
      .select("avail")
      .first();

    if (book.avail === "Y") {
      return res.status(400).send({ error: "Book is already available" });
    }

    // update the book to available
    const returnedbook = await database("books")
      .where({ ISBN: isbn })
      .update({ avail: "Y", rentedby: null });

    res.status(200).send({ returnedbook });
  } catch (error) {
    res.status(500).send({ error });
  }
});

module.exports = controller;





