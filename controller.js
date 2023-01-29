const express = require('express');
const controller = express.Router()
const knex = require('knex')
const path = require('node:path');
const { json } = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const database = require('./database');
const {verifyjwt , verifySuperadminJWT, verifyEitherJWT} = require('./admin-panel/login');
const { verify } = require('node:crypto');

controller.use(
    bodyParser.json({
      limit: '100MB',
    }),
  );



  controller.post('/postbook', [verifySuperadminJWT] , (req, res) => {
    const books = req.body;
    if (!Array.isArray(books)) {
      res.status(400).send({ error: 'SEND IN ARRAY BRO' });
      return;
    }
    database.transaction((trx) => {
        return trx.batchInsert('books', books)
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .then(() => {
        res.status(201).send({ message: 'Books added ' });
    })
    .catch((err) => {
        console.log(err);
        res.status(400).send({ error: 'error adding books' });
    });
  });

  //add books -> admin
  controller.delete('/delete/:isbn' , [verifySuperadminJWT], (req, res) => {
    const {isbn} = req.params
    database('books')
    .where({ISBN : isbn})
    .delete()
    .then(deletedbook => {
      res.send('Book successfully deleted')
    })
  })

  controller.get('/find/:isbn' , [verifyEitherJWT] , (req, res) => {
    const {isbn} = req.params
    database('books')
    .where({ISBN : isbn})
    .then(book => {
      res.send(book)
    })
  })


//edit a book -> admin - PUT REQUEST
controller.put('/editbook/:isbn', [verifySuperadminJWT], (req, res) => {
  const { isbn } = req.params;
  const { Bookname, Author, avail, rentedby } = req.body;
  database('books')
    .where({ ISBN : isbn })
    .update({ Bookname, Author, avail, rentedby})
    .then(() => {
      database.select().from('books').then((books) => {
        res.send(books);
      });
    })
    .catch((error) => {
      res.status(500).send({ error });
    });
});



  controller.get('/availablebooks' , [verifyEitherJWT] , (req, res) => {
    database('books')
    .select('Bookname' , 'Author' , 'ISBN' , 'avail')
      .where({ avail: 'Y' })
      .then((books) => {
        res.send(books);
      })
      .catch((error) => {
        res.status(500).send({ error });
      });
  });

controller.put('/rentbook/:isbn', [verifyEitherJWT], (req, res) => {
  const { isbn } = req.params;
  const { rentedby } = req.body;
  database('books')
    .where({ ISBN : isbn })
    .select('avail')
    .first()
    .then((book) => {
      if (book.avail === 'N') {
        res.status(400).send({ error: 'Book already rented' });
        return;
      }
      database('books')
        .where({ ISBN : isbn })
        .update({ avail: 'N' , rentedby})
        .then((rentedbook) => {
          res.status(200).send({rentedbook});
        });
    })
    .catch((error) => {
      res.status(500).send({ error });
    });
});

controller.put('/returnbook/:isbn' , [verifyEitherJWT], (req, res) => {
  const {isbn} = req.params
  database('books')
  .where({ISBN : isbn})
  .select('avail')
  .first()
  .then((book) => {
    if(book.avail === 'Y') {
      res.send('You cannot return a book which is already available')
      return;
    }
    database('books')
    .where({ISBN : isbn})
    .select('avail')
    .update({ avail: 'Y' , rentedby: null})
    .then((returnedbook) => {
      res.send({returnedbook})
    })
    
  })
})
module.exports = controller;





