const { MongoClient, ServerApiVersion } = require('mongodb');
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

        app.get("/all-products", async (req, res) => {

            const result = await productCollection.find({}).toArray();

            res.send(result);

        })

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