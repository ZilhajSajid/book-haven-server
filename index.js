const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://bookHavendb:s8sf84BDUIfDRyz8@cluster0.bmwxjo0.mongodb.net/?appName=Cluster0";

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
