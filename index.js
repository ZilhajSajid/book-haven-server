const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bmwxjo0.mongodb.net/?appName=Cluster0`;

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
      const newUser = req.body;
      const email = req.body.email;
      const query = { email: email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        res.send({ message: "user already exists." });
      } else {
        const result = await usersCollection.insertOne(newUser);
        res.send(result);
      }
    });

    app.get("/all-books", async (req, res) => {
      const cursor = bookHavenCollection.find();
      const result = await cursor.toArray();
      res.send(result);
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
      const newBooks = req.body;
      const result = await myBooksCollection.insertOne(newBooks);
      res.send(result);
    });

    app.delete("/myBooks/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await myBooksCollection.deleteOne(query);
      res.send(result);
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
