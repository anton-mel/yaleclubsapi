const express = require("express");
const path = require("path");
require('dotenv').config();
const session = require('express-session');
const bodyParser = require("body-parser");
const cors = require('cors');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const http = require('http');
const WebSocket = require('ws');

// Routes
const authMiddleware = require('./middleware/authMiddleware');
const data = require("./routes/data");
const comment = require("./routes/comment");
const comments = require("./routes/comments");
const auth = require("./routes/auth");
const logout = require("./routes/logout");
const save_club = require("./routes/save");
const events = require("./routes/events");
const subscribe = require("./routes/subscribe");

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useUnifiedTopology: true });

mongoose.connection.on('connected', () => {
	console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
	console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
	console.log('MongoDB disconnected');
});

const app = express();
const server = http.createServer(app);
const socketServer = new WebSocket.Server({ noServer: true });

app.use(cors());


// Session
app.use(session({
	secret: "yaleclubs",
	saveUninitialized: false,
	resave: false,
	store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI}),
}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:8081');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// Middleware
app.use((req, res, next) => {
	if (!req.url.startsWith('/api')) {
		authMiddleware(req, res, next);
    } else {
        next();
    }
});

// Views
app.set("views",  path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("html", require("ejs").renderFile);

// Body parser MW
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

// Routes
app.use("/api", data);
app.use("/api", comment);
app.use("/api", comments);
app.use("/api", auth);
app.use("/api", logout);
app.use("/api", save_club);
app.use("/api", events);
app.use("/api", subscribe);


// WebSocket server handling upgrades
server.on('upgrade', (request, socket, head) => {
    socketServer.handleUpgrade(request, socket, head, (ws) => {
        socketServer.emit('connection', ws, request);
    });
});

socketServer.on('connection', (socket) => {
    console.log(`WebSocket connected: ${socket}`);

    // Handle WebSocket events here
    socket.on('message', (message) => {
        console.log(`Received WebSocket message: ${message}`);
    });

    socket.on('close', () => {
        console.log('WebSocket disconnected');
    });
});

// Make the WebSocket server available to other parts of your application
app.io = socketServer;