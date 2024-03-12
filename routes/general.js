const express = require('express');
let books = require("./../public/booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const axios = require('axios');

///The code should take the ‘username’ and ‘password’ provided in the body of the request for registration.
// If the username already exists,
// it must mention the same & must also show other errors like 'eg'. when username &/ password are not provided.
public_users.post("/register", (req,res) => {
  const { username, password } = req.body;

  // Check if username and password are provided
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  if (username && password) {
    if (!isValid(username)) {
      users.push({"username":username,"password":password});
      return res.status(200).json({message: "User successfully registered. Now you can login"});
    } else {
      return res.status(404).json({message: "User already exists!"});
    }
  }
  return res.status(404).json({message: "Unable to register user."});
});


// Get the book list available in the shop
public_users.get('/',async function (req, res) {

  try {
    const allBooks = await books;
    if (!allBooks || Object.keys(allBooks).length === 0) {
      return res.status(400).json({ message: "Empty book list" });
    } else {
      return res.send(JSON.stringify(allBooks, null, 4));
    }
  } catch (error) {
    console.error('Error fetching book list:', error);
    return res.status(500).json({ message: "Error fetching book list" });
  }
});



// Get book details based on ISBN
public_users.get('/isbn/:isbn',async function (req, res) {
  //Write your code here
  try{
    const book = await books[req.params.isbn];
    // Check if the book with the given ISBN exists
    if (book) {
      return res.status(200).json(book);
    } else {
      return res.status(404).json({ message: "Book not found" });
    }
  }catch (e) {
    console.error('Error fetching book ISBN:', e);
    return res.status(500).json({ message: "Error fetching book ISBN" });
  }

 });
  
// Get book details based on author
public_users.get('/author/:author',async function (req, res) {
  //Write your code here

  try {
    // Search for books by author name
    const [authorBooks] = await Promise.all([Object.values(books).filter(book => book.author === req.params.author)]);
    // Check if any books were found for the author
    if (authorBooks.length > 0) {
      return res.status(200).json(authorBooks);
    } else {
      return res.status(404).json({ message: "Books by author not found" });
    }
  }catch (e) {
    console.error('Error fetching book author:', e);
    return res.status(500).json({ message: "Error fetching book author" });
  }

});

// Get all books based on title
public_users.get('/title/:title',async function (req, res) {
  //Write your code here
  // Search for books by title
  try {
    const [titleBooks] = await Promise.all([Object.values(books).filter(book => book.title === req.params.title)]);
    // Check if any books were found for the title
    if (titleBooks.length > 0) {
      return res.status(200).json({books: titleBooks});
    } else {
      return res.status(404).json({ message: "Books with title not found" });
    }
  }catch (e) {
    console.error('Error fetching book title:', e);
    return res.status(500).json({ message: "Error fetching book title" });
  }
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  //Write your code here
  const isbn = req.params.isbn;
  // Check if the book with the given ISBN exists
  if (books[isbn]) {
    const reviews = books[isbn].reviews;
    return res.status(200).json(reviews);
  } else {
    return res.status(404).json({ message: "Book not found" });
  }
});

module.exports.general = public_users;
