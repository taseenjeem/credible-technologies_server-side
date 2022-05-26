const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require("express");
const app = express();
const cors = require("cors");
require('dotenv').config();
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.znb7z.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized access" });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "Forbidden Access" });
        }
        req.decoded = decoded;
        next();
    })

}


async function run() {

    try {

        await client.connect();
        const productCollection = client.db("credible_technologies").collection('products');
        const bookingCollection = client.db("credible_technologies").collection('bookings');
        const userCollection = client.db("credible_technologies").collection('users');
        const reviewCollection = client.db("credible_technologies").collection('reviews');

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

            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '24h' })

            res.send({ result, token });

        });

        app.get("/my-orders", verifyJWT, async (req, res) => {

            const user = req.query.customerEmail;

            const decodedEmail = req.decoded.email;

            if (user === decodedEmail) {

                const q = { customerEmail: user };

                const result = await bookingCollection.find(q).toArray();

                res.send(result);

            } else {
                return res.status(403).send({ message: 'Forbidden access' })
            }

        });

        app.get('/all-users', verifyJWT, async (req, res) => {

            const users = await userCollection.find().toArray();

            res.send(users);

        });

        app.put('/user/admin/:email', verifyJWT, async (req, res) => {

            const email = req.params.email;

            const requester = req.decoded.email;

            const requesterAccount = await userCollection.findOne({ email: requester });

            if (requesterAccount.role === "admin") {

                const filter = { email: email };

                const updateDoc = {
                    $set: { role: 'admin' },
                };

                const result = await userCollection.updateOne(filter, updateDoc);

                res.send(result);

            } else {

                res.status(403).send({ message: "Forbidden" });

            }

        });

        app.get('/admin/:email', async (req, res) => {

            const email = req.params.email;

            const user = await userCollection.findOne({ email: email });

            const isAdmin = user.role === 'admin';

            res.send({ admin: isAdmin })

        });

        app.get("/ordered-products", async (req, res) => {

            const result = await bookingCollection.find({}).toArray();

            res.send(result);

        });

        app.post("/add-product", async (req, res) => {

            const product = req.body;

            const result = await productCollection.insertOne(product);

            res.send(result);

        });

        app.get("/all-reviews", async (req, res) => {

            const result = await reviewCollection.find({}).toArray();

            res.send(result);

        });

        app.post("/add-review", async (req, res) => {

            const product = req.body;

            const result = await reviewCollection.insertOne(product);

            res.send(result);

        });

        app.delete('/delete-product/:id', async (req, res) => {

            const id = req.params.id;

            const q = { _id: ObjectId(id) };

            const result = await productCollection.deleteOne(q);

            res.send(result);

        });

        app.put('/update-a-product/:id', async (req, res) => {

            const id = req.params.id;

            const data = req.body;

            const filter = { _id: ObjectId(id) };

            const options = { upsert: true };

            const updatedDoc = {
                $set: data
            };

            const result = await productCollection.updateOne(filter, updatedDoc, options);

            res.send(result)
        });

        app.put('/update-product-quantity/:id', async (req, res) => {

            const id = req.params.id;

            const data = req.body;

            const filter = { _id: ObjectId(id) };

            const options = { upsert: true };

            const updatedDoc = {
                $set: data
            };

            const result = await productCollection.updateOne(filter, updatedDoc, options);

            res.send(result)

        });

        app.get("/get-payment/:id", verifyJWT, async (req, res) => {

            const id = req.params.id;

            const q = { _id: ObjectId(id) };

            const result = await bookingCollection.findOne(q);

            res.send(result);

        });

        app.post("/create-payment-intent", verifyJWT, async (req, res) => {

            const product = req.body;

            const price = product.price;

            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });

            res.send({ clientSecret: paymentIntent.client_secret });

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