const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./../public/booksdb");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
//write code to check is the username is valid
  let usersWithSameName = users.filter((user)=>{
    return user.username === username
  });
  return usersWithSameName.length > 0;
}

const authenticatedUser = (username,password)=>{ //returns boolean
//write code to check if username and password match the one we have in records.
  let validUsers = users.filter((user)=>{
    return (user.username === username && user.password === password)
  });
  return validUsers.length > 0;
}

//only registered users can log in
regd_users.post("/login", (req,res) => {
  //Write your code here
  const { username, password } = req.body;
  // Check if username and password are provided
  if (!username || !password) {
    return res.status(400).json({ message: 'Username or password are required.' });
  }

  if (authenticatedUser(username,password)) {
    let accessToken = jwt.sign({
      data: password, username: username
    }, 'access', { expiresIn: 60*60 });

    req.session.authorization = {
      accessToken,username
    }
    return res.status(200).send({message: "User successfully logged in",token:accessToken});
  } else {
    return res.status(208).json({message: "Unknown user. Check username and password"});
  }

});

// Add a book review
/**
 *  You have to give a review as a request query & it must get posted with the username (stored in the session) posted.
 *  If the same user posts a different review on the same ISBN, it should modify the existing review.
 *  If another user logs in and posts a review on the same ISBN,
 *  it will get added as a different review under the same ISBN.
 *
 * */
regd_users.put("/auth/review/:isbn", (req, res) => {
  //Write your code here

  //a review as a request query & it must get posted with the username (stored in the session) posted.
  const isbn = req.params.isbn;
  const { review } = req.query;
  const username = req.session.authorization.username;
  // Check if the review query parameter is provided
  if (!review) {
    return res.status(400).json({ message: 'Review is required.' });
  }

  // Find the book with the given ISBN
  const bookIndex = books[isbn];

  // If the book doesn't exist, return an error
  if (!bookIndex) {
    return res.status(404).json({ message: 'Book not found.' });
  }
  // Check if the user has already reviewed this book
  const existingReview = bookIndex.reviews[username];
  //If the same user posts a different review on the same ISBN, it should modify the existing review.
  if (existingReview) {// If the user has already reviewed this book, update the review
    bookIndex.reviews[username] = review;
    return res.status(200).json({ message: 'Review updated successfully.' });
  }

  // If the user hasn't reviewed this book yet, add a new review
  bookIndex.reviews[username] = { comment: review };
  return res.status(201).json({ message: 'Review added successfully.' });
});

//Filter & delete the reviews based on the session username, so that a user can delete only his/her reviews and not other users’.
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;

  const book = books[isbn]; // Find the book with the given ISBN
  // If the book doesn't exist, return an error
  if (!book) {
    return res.status(404).json({ message: 'Book not found.' });
  }

  let existingReview = book.reviews[username];//Getting book reviews by username
  if (!existingReview) {// Check if the review exists for the given ISBN and username
    return res.status(404).json({ message: `Review not found for book with ISBN number ${isbn} by ${username}`});
  }
  // Check if the review belongs to the logged-in user
  console.log(existingReview)
  if (!book.reviews.hasOwnProperty(username)) {
    return res.status(403).json({ message: 'Unauthorized to delete this review.' });
  }else {
    delete book.reviews[username]; // Delete the review if it belongs to the logged-in user
    return res.status(200).json({ message: 'Review deleted successfully.' });
  }

});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
