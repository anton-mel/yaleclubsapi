const axios = require("axios")
const express = require("express");
const jwt = require("jsonwebtoken");
const { XMLParser} = require("fast-xml-parser");

// MongoDB Interface
const User = require("../models/user");

const router = express.Router();
const CAS_SERVER = 'https://secure.its.yale.edu';
const CAS_VALIDATE_ROUTE = '/cas/serviceValidate';
const CAS_SERVICE = `https://yaleclubsapi.vercel.app/api/auth/redirect`;

// Yale CAS System Configs
const get_ticket_validation_link = (ticket) => {
    const validateURL = new URL(CAS_VALIDATE_ROUTE, CAS_SERVER)
    validateURL.searchParams.append('ticket', ticket)
    validateURL.searchParams.append('service', CAS_SERVICE)
    return validateURL.toString()
}

// Function to handle CAS validation
const handleCASValidation = async (ticket) => {
    try {
        const casResponse = await axios.get(get_ticket_validation_link(ticket));

        if (casResponse.data === undefined) {
            throw new Error('Invalid response from CAS server');
        }

        // XML Parser Unwrap User Data
        const parser = new XMLParser();
        const results = parser.parse(casResponse.data);
        const userId = results['cas:serviceResponse']['cas:authenticationSuccess']['cas:user'];

        return userId;
    } catch (error) {
        console.error('Error in CAS redirection:', error);
        throw error;
    }
};

router.get('/auth/redirect', async (req, res) => {
    try {
        const userId = await handleCASValidation(req.query.ticket);

        // Check if the user is already in MongoDB
        const existingUser = await User.findOne({ userId });

        // Save the user to MongoDB if not already present
        if (!existingUser) {
            const newUser = new User({ userId });
            await newUser.save();
            console.log(`User ${userId} saved to MongoDB`);
        }

        // Save with Expo-Session
        req.session.user = userId;
        req.session.redirected = true;
        res.redirect('http://localhost:8081/login');
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});
 
// Client Auth Provider
router.get('/auth/verify', (req, res) => {
    try {
        if (req.session.user) {
            const token = jwt.sign({ userId: req.session.user }, process.env.JWT_SECRET, { expiresIn: '12h' });
            
            // Save Id & Token
            const responseData = {
                userId: "123",
                token,
            };
            
            res.status(200).json(token);
        } else {
            res.status(401).json({ error: 'User not authenticated' });
        }
    } catch (error) {
        console.error('Error in /auth/verify:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Remove the Expo Session
router.get('/auth/logout', (req, res) => {
    try {
        if (req.session.user) {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                    res.status(500).send('Internal Server Error');
                } else {
                    res.status(200).send("Successfully Logged Out");
                }
            });
        } else {
            // If the user is not authenticated, consider sending a 401 status.
            res.status(401).send('User not authenticated');
        }
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;