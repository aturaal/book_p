const express = require('express');
const database = require('/database');
const {verifyEitherJWT , verifySuperadminJWT, verifyjwt, router} = require('./admin-panel/login');
const jwt = require('jsonwebtoken');
const router2 = express.Router();
const env = require('dotenv')
env.config();

router.get('/allbooks' , [verifyEitherJWT] , async (req, res) => {

  try {

  const allbooks = await database("books")
  .select('Bookname', 'Author' , 'ISBN' , 'avail')
  .then((allb) => {
    res.send(allb)
  })

}
catch{
  res.status(401).send("Unauth")
  return;
}

})

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

router2.put("/rentbook/:isbn", [verifyEitherJWT], async (req, res) => {
  try {
    
    const { isbn } = req.params;
    const decoded = jwt.verify(req.cookies.token , process.env.JWT || process.env.JWT2)
    const rentedby = decoded.mail

    // Check if rentedby is not empty here
    if (!rentedby) {
      res.status(400).send({ error: "Authorization missing" });
      return;
    }

    // Check if book is available
    const book = await database("books")
      .where({ ISBN: isbn })
      .select("avail")
      .first();
    if (book.avail === "N") {
       res
       .status(400)
       .send({ error: "Book already rented"});
       return;
    }

    // Update book to rented
    await database("books")
      .where({ ISBN: isbn })
      .update({ avail: "N" });

    await database("books")
      .where({ ISBN: isbn })
      .update({ rentedby: rentedby });

    const rentedbook = await database("books")
      .where({ ISBN: isbn })
      .select("*")
      .first();

    res
      .status(200)
      .send({ rentedbook });
  } catch (error) {
    res.status(500).send({ error });
    console.log(error)
  }
});

// Return a book -> admin/user
router2.put("/returnbook/:isbn", [verifyEitherJWT], async (req, res) => {
  try {
    const { isbn } = req.params;
    const decoded = jwt.verify(req.cookies.token , process.env.JWT || process.env.JWT2)
    const rentedby = decoded.mail

    if(!rentedby) {
      res
      .status(400)
      .send({error: "Authorization Missing!"})
      return;
    }

    // Check if book is rented
    const book = await database("books")
      .where({ ISBN: isbn })
      .select("avail")
      .first();

    if (book.avail === "Y") {
      res
      .status(400).send({ error: "Book is already available" });
      return;
    }

    const rentcheck = await database("books")
    .where({ISBN: isbn})
    .select("rentedby")
    .first();

    if (rentcheck.rentedby != rentedby) {
      console.log(rentcheck.rentedby)
      res
      .status(400)
      .send({error: 'This book is not rented by you, you cannot return it!'})
      return;
    }

    // Update book to available
    const returnedbook = await database("books")
      .where({ ISBN: isbn })
      .update({ avail: "Y", rentedby: null });

    res
    .status(200).send({ returnedbook , rentedby});
  } catch (error) {
    res
    .status(500).send({ error });
  }
});

module.exports = router2;






