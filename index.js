const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.bmwxjo0.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("Book haven server is running");
});

async function run() {
  try {
    await client.connect();

    const db = client.db("bookHavendb");
    const bookHavenCollection = db.collection("books");
    const myBooksCollection = db.collection("myBooks");
    const usersCollection = db.collection("users");

    // users related APIs
    app.post("/users", async (req, res) => {
      try {
        const { name, email, password, photoURL } = req.body;
        if (!name || !email || !photoURL)
          return res.status(400).send({ message: "All fields are required." });

        const existingUser = await usersCollection.findOne({ email });
        if (existingUser)
          return res.status(400).send({ message: "User already exists." });

        const result = await usersCollection.insertOne({
          name,
          email,
          password: password || null,
          photoURL,
        });
        return res
          .status(201)
          .send({ message: "User registered successfully!", result });
      } catch (error) {
        console.error(error);
        return res.status(500).send({ message: "Server error" });
      }
    });

    app.get("/latest-books", async (req, res) => {
      const cursor = bookHavenCollection.find().sort({ rating: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/all-books", async (req, res) => {
      const cursor = bookHavenCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/featured-books", async (req, res) => {
      const cursor = bookHavenCollection.find().sort({ rating: -1 }).limit(1);
      const result = await cursor.toArray();
      res.send(result[0]);
    });

    app.get("/all-books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookHavenCollection.findOne(query);
      res.send(result);
    });

    app.post("/all-books", async (req, res) => {
      const newBooks = req.body;
      const result = await bookHavenCollection.insertOne(newBooks);
      res.send(result);
    });

    app.patch("/all-books/:id", async (req, res) => {
      const id = req.params.id;
      const updatedBook = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          title: updatedBook.title,
          author: updatedBook.author,
        },
      };
      const result = await bookHavenCollection.updateOne(query, update);
      res.send(result);
    });

    app.delete("/all-books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookHavenCollection.deleteOne(query);
      res.send(result);
    });

    // myBooks APIs
    app.get("/myBooks", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.userEmail = email;
      }
      const cursor = myBooksCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/myBooks", async (req, res) => {
      try {
        const newBook = req.body;
        const email = newBook.userEmail;
        const { title, author } = newBook;

        if (!email)
          return res.status(400).send({ message: "Email is required" });
        if (!title || !author)
          return res
            .status(400)
            .send({ message: "Title and Author are required" });

        // Remove any existing _id to avoid MongoDB conflict
        delete newBook._id;

        // Check if this user already added this book
        const existingBook = await myBooksCollection.findOne({
          userEmail: email,
          title,
          author,
        });

        if (existingBook) {
          return res
            .status(400)
            .send({ message: "You have already added this book." });
        }

        // Insert the book for this user
        const result = await myBooksCollection.insertOne(newBook);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });
    app.get("/myBooks", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: "Email is required" });

      const result = await myBooksCollection.find({ email }).toArray();
      res.send(result);
    });

    app.delete("/myBooks/:id", async (req, res) => {
      const id = req.params.id;

      try {
        // Check if the id looks like an ObjectId
        const query =
          ObjectId.isValid(id) && id.length === 24
            ? { _id: new ObjectId(id) }
            : { _id: id };

        const result = await myBooksCollection.deleteOne(query);

        if (result.deletedCount > 0) {
          res.send({ message: "Book deleted successfully!", deletedCount: 1 });
        } else {
          res.status(404).send({ message: "Book not found." });
        }
      } catch (error) {
        console.error("Error deleting book:", error);
        res.status(500).send({ message: "Server error while deleting book." });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Book haven server is running on port: ${port}`);
});
