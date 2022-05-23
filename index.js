const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require("express");
const app = express();
const cors = require("cors");
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.znb7z.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {

    try {

        await client.connect();
        const productCollection = client.db("credible_technologies").collection('products');
        const bookingCollection = client.db("credible_technologies").collection('bookings');
        const userCollection = client.db("credible_technologies").collection('users');

        app.get("/all-products", async (req, res) => {

            const result = await productCollection.find({}).toArray();

            res.send(result);

        });

        app.get("/purchase/:id", async (req, res) => {

            const id = req.params.id;

            const q = { _id: ObjectId(id) };

            const product = await productCollection.findOne(q);

            res.send(product);

        });

        app.post('/order-bookings', async (req, res) => {

            const order = req.body;

            const result = await bookingCollection.insertOne(order);

            res.send(result);

        });

        app.put('/user/:email', async (req, res) => {

            const email = req.params.email;

            const user = req.body;

            const filter = { email: email };

            const options = { upsert: true };

            const updateDoc = {
                $set: user,
            };

            const result = await userCollection.updateOne(filter, updateDoc, options);

            res.send({ result });

        });

    }
    finally {

    }

}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("Credible Technologies Ltd.");
});

app.listen(port, () => {
    console.log("Running successfully : ", port);
})