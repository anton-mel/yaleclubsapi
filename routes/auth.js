const axios = require("axios")
const express = require("express");
const jwt = require("jsonwebtoken");
import { Platform } from 'react-native';
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

router.get('/auth/redirect', async (req, res) => {
    try {
        const casResponse = await axios.get(get_ticket_validation_link(req.query.ticket));
        
        // Error Handler
        if (casResponse.data === undefined) {
            return res.status(400).send('Invalid response from CAS server');
        }
        
        // XML Parser Unwrap User Data
        const parser = new XMLParser();
        const results = parser.parse(casResponse.data);
        const userId = results['cas:serviceResponse']['cas:authenticationSuccess']['cas:user'];
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '12h' });
        
        // Check if the user is already in MongoDB
        const existingUser = await User.findOne({ userId });
        
        // Save the user to MongoDB if not already present
        if (!existingUser) {
            const newUser = new User({ userId });
            await newUser.save();
            
            console.log(`User ${userId} saved to MongoDB`);
        }
    
        const userAgent = req.headers['user-agent'];

        if (userAgent.includes('Expo')) {
            // Redirect for Expo Go (physical device)
            res.redirect(`exp://l-ke0mi.anonymous.8081.exp.direct/--/login?token=${token}`);
        } else {
            // Redirect for web or other platforms
            res.redirect(`http://localhost:8081/login?token=${token}`);
        }
    } catch (error) {
        console.error('Error in CAS redirection:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;