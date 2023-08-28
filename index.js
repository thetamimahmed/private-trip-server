const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rgrretg.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const restaurantsCollection = client.db("privateTrip").collection("restaurants");
    const hotelsCollection = client.db("privateTrip").collection("hotels");

    app.get("/restaurants", async (req, res) => {
      const result = await restaurantsCollection.find().toArray();
      res.send(result);
    });

    //get individual data of search
    app.get("/searchResult/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const restaurantsResult = await restaurantsCollection.find().toArray();
      const hotelsResult = await hotelsCollection.find().toArray();
      const combineResults = [...restaurantsResult, ...hotelsResult];
      const selectedCard = combineResults.find(data => data._id.toString() == id)
      console.log(selectedCard)
      return res.send(selectedCard);
    });

    app.get("/:category/:searchText", async (req, res) => {
      const searchText = req.params.searchText;
      const category = req.params.category;
      if (category === "hotels") {
        const query = searchText
          ? {
              hotelName: { $regex: new RegExp(searchText, "i") },
            }
          : {};
        const result = await hotelsCollection.find(query).toArray();
        return res.send(result);
      } else if (category === "restaurants") {
        const query = searchText
          ? {
              title: { $regex: new RegExp(searchText, "i") },
            }
          : {};
        const result = await restaurantsCollection.find(query).toArray();
        return res.send(result);
      } else if (category === "search-all") {
        const query = searchText
          ? {
              $or: [
                { title: { $regex: new RegExp(searchText, "i") } },
                { hotelName: { $regex: new RegExp(searchText, "i") } },
              ],
            }
          : {};
        const restaurantsResult = await restaurantsCollection
          .find(query)
          .toArray();
        const hotelsResult = await hotelsCollection.find(query).toArray();
        const combineResults = [...restaurantsResult, ...hotelsResult];
        return res.send(combineResults);
      } else {
        return res.send([]);
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

app.get("/", (req, res) => {
  res.send("Running private trip");
});

app.listen(port, () => {
  console.log(`private trip Is running On: ${port}`);
});
