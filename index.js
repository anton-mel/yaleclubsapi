// Index.js
const express = require("express");
const session = require('express-session');
const bodyParser = require("body-parser");
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

require('dotenv').config();
const path = require("path");
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

// Routes
const authMiddleware = require('./middleware/authMiddleware');
const subscribe = require("./routes/subscribe");
const comments = require("./routes/comments");
const comment = require("./routes/comment");
const save_club = require("./routes/save");
const logout = require("./routes/logout");
const events = require("./routes/events");
const data = require("./routes/data");
const auth = require("./routes/auth");

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {console.log('MongoDB connected successfully');});
mongoose.connection.on('error', (err) => {console.error('MongoDB connection error:', err);});
mongoose.connection.on('disconnected', () => {console.log('MongoDB disconnected');});

// Set Up
const app = express();
const server = http.createServer(app);

// Create a WebSocket server and attach it to the HTTP server
const socketServer = new WebSocket.Server({ server });

// Configure CORS
const corsOptions = {
    origin: 'http://localhost:8081',
    methods: 'POST, GET, PATCH, DELETE, OPTIONS',
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept',
    credentials: true, // cookies
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Session
app.use(session({
	secret: "yaleclubs",
	saveUninitialized: false,
	resave: false,
	store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI}),
}));

// Middleware
app.use((req, res, next) => {
	if (!req.url.startsWith('/api')) {
		authMiddleware(req, res, next);
    } else {
        next();
    }
});

// Body parser MW
app.use(express.json());
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

// Views
app.set("views",  path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("html", require("ejs").renderFile);

// The following code is needed for local dev
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

// Run Server Locally
const PORT = process.env.PORT || 8082;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.io = socketServer;
module.exports = app;