const express = require('express');
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const cors = require('cors');

// ============= CONFIGURATION =============
const MONGO_URL = "mongodb://localhost:27017";
const DB_NAME = "test_database";
const JWT_SECRET = "eventflow_super_secret_key_change_in_production_2024";
const JWT_EXPIRATION_HOURS = 24;
const PORT = 8000;

const app = express();

// ============= MIDDLEWARE =============
app.use(express.json());
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// MongoDB Connection
let db;
const client = new MongoClient(MONGO_URL);

async function connectDB() {
    try {
        await client.connect();
        db = client.db(DB_NAME);
        console.log(`Connected to MongoDB: ${DB_NAME}`);
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
}

connectDB();

// ============= HELPER FUNCTIONS =============

const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

const verifyPassword = async (password, hashed) => {
    return await bcrypt.compare(password, hashed);
};

const createToken = (userId, email, role) => {
    return jwt.sign(
        { user_id: userId, email, role },
        JWT_SECRET,
        { expiresIn: `${JWT_EXPIRATION_HOURS}h` }
    );
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ detail: "Token missing" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ detail: "Token expired" });
            }
            return res.status(401).json({ detail: "Invalid token" });
        }
        req.user = user;
        next();
    });
};

const generateQRCode = async (data) => {
    try {
        return await QRCode.toDataURL(data);
    } catch (err) {
        console.error('QR Code generation error:', err);
        return "";
    }
};

// ============= AUTH ROUTES =============

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ detail: "Email already registered" });
        }

        const userId = uuidv4();
        const hashedPassword = await hashPassword(password);

        const userDoc = {
            id: userId,
            email,
            password: hashedPassword,
            name,
            role: role || "student",
            created_at: new Date().toISOString()
        };

        await db.collection('users').insertOne(userDoc);

        const token = createToken(userId, email, userDoc.role);

        res.json({
            token,
            user: {
                id: userId,
                email,
                name,
                role: userDoc.role
            }
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.collection('users').findOne({ email });

        if (!user || !(await verifyPassword(password, user.password))) {
            return res.status(401).json({ detail: "Invalid credentials" });
        }

        const token = createToken(user.id, user.email, user.role);

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await db.collection('users').findOne({ id: req.user.user_id });
        if (!user) {
            return res.status(404).json({ detail: "User not found" });
        }
        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// ============= EVENT ROUTES =============

app.post('/api/events', authenticateToken, async (req, res) => {
    try {
        if (!["coordinator", "admin"].includes(req.user.role)) {
            return res.status(403).json({ detail: "Only coordinators and admins can create events" });
        }

        const eventId = uuidv4();
        const { title, description, date, time, venue, capacity, category, image_url } = req.body;

        const coordinator = await db.collection('users').findOne({ id: req.user.user_id });

        const eventDoc = {
            id: eventId,
            title,
            description,
            date,
            time,
            venue,
            capacity: parseInt(capacity),
            category,
            status: "upcoming",
            coordinator_id: req.user.user_id,
            coordinator_name: coordinator ? coordinator.name : req.user.email,
            image_url,
            created_at: new Date().toISOString()
        };

        await db.collection('events').insertOne(eventDoc);
        res.json({ ...eventDoc, registered_count: 0 });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

app.get('/api/events', async (req, res) => {
    try {
        const { status, category } = req.query;
        const query = {};
        if (status) query.status = status;
        if (category) query.category = category;

        const events = await db.collection('events').find(query).toArray();

        const result = await Promise.all(events.map(async (event) => {
            const count = await db.collection('registrations').countDocuments({ event_id: event.id });
            const { _id, ...eventData } = event;
            return { ...eventData, registered_count: count };
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

app.get('/api/events/:event_id', async (req, res) => {
    try {
        const event = await db.collection('events').findOne({ id: req.params.event_id });
        if (!event) {
            return res.status(404).json({ detail: "Event not found" });
        }
        const count = await db.collection('registrations').countDocuments({ event_id: req.params.event_id });
        const { _id, ...eventData } = event;
        res.json({ ...eventData, registered_count: count });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

app.put('/api/events/:event_id', authenticateToken, async (req, res) => {
    try {
        const event = await db.collection('events').findOne({ id: req.params.event_id });
        if (!event) {
            return res.status(404).json({ detail: "Event not found" });
        }

        if (!["coordinator", "admin"].includes(req.user.role)) {
            return res.status(403).json({ detail: "Unauthorized" });
        }

        if (req.user.role === "coordinator" && event.coordinator_id !== req.user.user_id) {
            return res.status(403).json({ detail: "You can only update your own events" });
        }

        const updateData = {};
        const allowedFields = ['title', 'description', 'date', 'time', 'venue', 'capacity', 'category', 'status', 'image_url'];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = field === 'capacity' ? parseInt(req.body[field]) : req.body[field];
            }
        });

        if (Object.keys(updateData).length > 0) {
            await db.collection('events').updateOne({ id: req.params.event_id }, { $set: updateData });
            Object.assign(event, updateData);
        }

        const count = await db.collection('registrations').countDocuments({ event_id: req.params.event_id });
        const { _id, ...eventData } = event;
        res.json({ ...eventData, registered_count: count });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

app.delete('/api/events/:event_id', authenticateToken, async (req, res) => {
    try {
        const event = await db.collection('events').findOne({ id: req.params.event_id });
        if (!event) {
            return res.status(404).json({ detail: "Event not found" });
        }

        if (!["coordinator", "admin"].includes(req.user.role)) {
            return res.status(403).json({ detail: "Unauthorized" });
        }

        if (req.user.role === "coordinator" && event.coordinator_id !== req.user.user_id) {
            return res.status(403).json({ detail: "You can only delete your own events" });
        }

        await db.collection('events').deleteOne({ id: req.params.event_id });
        res.json({ message: "Event deleted successfully" });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// ============= REGISTRATION ROUTES =============

app.post('/api/registrations', authenticateToken, async (req, res) => {
    try {
        const { event_id } = req.body;
        const event = await db.collection('events').findOne({ id: event_id });
        if (!event) {
            return res.status(404).json({ detail: "Event not found" });
        }

        const existing = await db.collection('registrations').findOne({
            event_id: event_id,
            user_id: req.user.user_id
        });
        if (existing) {
            return res.status(400).json({ detail: "Already registered for this event" });
        }

        const count = await db.collection('registrations').countDocuments({ event_id: event_id });
        if (count >= event.capacity) {
            return res.status(400).json({ detail: "Event is full" });
        }

        const registrationId = uuidv4();
        const qrData = `eventflow:${event_id}:${req.user.user_id}:${registrationId}`;
        const qrCodeImg = await generateQRCode(qrData);

        const regDoc = {
            id: registrationId,
            event_id,
            user_id: req.user.user_id,
            qr_code: qrCodeImg,
            attendance_status: "registered",
            registration_date: new Date().toISOString()
        };

        await db.collection('registrations').insertOne(regDoc);
        res.json({ ...regDoc, event_title: event.title });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

app.get('/api/registrations/my', authenticateToken, async (req, res) => {
    try {
        const registrations = await db.collection('registrations').find({ user_id: req.user.user_id }).toArray();

        const result = await Promise.all(registrations.map(async (reg) => {
            const event = await db.collection('events').findOne({ id: reg.event_id });
            const { _id, ...regData } = reg;
            return { ...regData, event_title: event ? event.title : "Unknown Event" };
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

app.get('/api/registrations/event/:event_id', authenticateToken, async (req, res) => {
    try {
        if (!["coordinator", "admin"].includes(req.user.role)) {
            return res.status(403).json({ detail: "Unauthorized" });
        }

        const registrations = await db.collection('registrations').find({ event_id: req.params.event_id }).toArray();

        const result = await Promise.all(registrations.map(async (reg) => {
            const user = await db.collection('users').findOne({ id: reg.user_id });
            const { _id, ...regData } = reg;
            return {
                ...regData,
                user_name: user ? user.name : "Unknown",
                user_email: user ? user.email : "Unknown"
            };
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

app.post('/api/attendance/mark', authenticateToken, async (req, res) => {
    try {
        if (!["coordinator", "admin"].includes(req.user.role)) {
            return res.status(403).json({ detail: "Unauthorized" });
        }

        const { registration_id } = req.body;
        const result = await db.collection('registrations').updateOne(
            { id: registration_id },
            { $set: { attendance_status: "attended" } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ detail: "Registration not found" });
        }

        res.json({ message: "Attendance marked successfully" });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// ============= VOLUNTEER ROUTES =============

app.post('/api/volunteers', authenticateToken, async (req, res) => {
    try {
        if (!["coordinator", "admin"].includes(req.user.role)) {
            return res.status(403).json({ detail: "Unauthorized" });
        }

        const { event_id, user_email, role, responsibilities } = req.body;
        const user = await db.collection('users').findOne({ email: user_email });

        if (!user) {
            return res.status(404).json({ detail: "User not found" });
        }

        const existing = await db.collection('volunteers').findOne({
            event_id: event_id,
            user_id: user.id
        });
        if (existing) {
            return res.status(400).json({ detail: "User is already a volunteer for this event" });
        }

        const volunteerId = uuidv4();
        const volDoc = {
            id: volunteerId,
            event_id,
            user_id: user.id,
            user_name: user.name,
            user_email: user.email,
            role,
            responsibilities,
            created_at: new Date().toISOString()
        };

        await db.collection('volunteers').insertOne(volDoc);
        const { _id, ...volData } = volDoc;
        res.json(volData);
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

app.get('/api/volunteers/event/:event_id', authenticateToken, async (req, res) => {
    try {
        const volunteers = await db.collection('volunteers').find({ event_id: req.params.event_id }).toArray();
        const result = volunteers.map(({ _id, ...vol }) => vol);
        res.json(result);
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// ============= FEEDBACK ROUTES =============

app.post('/api/feedback', authenticateToken, async (req, res) => {
    try {
        const { event_id, rating, comment } = req.body;

        const registration = await db.collection('registrations').findOne({
            event_id: event_id,
            user_id: req.user.user_id
        });

        if (!registration) {
            return res.status(400).json({ detail: "You must register for the event to give feedback" });
        }

        const existing = await db.collection('feedback').findOne({
            event_id: event_id,
            user_id: req.user.user_id
        });
        if (existing) {
            return res.status(400).json({ detail: "Feedback already submitted" });
        }

        const feedbackId = uuidv4();
        const user = await db.collection('users').findOne({ id: req.user.user_id });

        const feedbackDoc = {
            id: feedbackId,
            event_id,
            user_id: req.user.user_id,
            user_name: user ? user.name : "",
            rating,
            comment,
            timestamp: new Date().toISOString()
        };

        await db.collection('feedback').insertOne(feedbackDoc);
        const { _id, ...fbData } = feedbackDoc;
        res.json(fbData);
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

app.get('/api/feedback/event/:event_id', async (req, res) => {
    try {
        const feedbackList = await db.collection('feedback').find({ event_id: req.params.event_id }).toArray();
        const result = feedbackList.map(({ _id, ...fb }) => fb);
        res.json(result);
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// ============= CHATBOT ROUTES =============

app.post('/api/chat', authenticateToken, async (req, res) => {
    try {
        const { message, session_id } = req.body;
        const events = await db.collection('events').find({ status: "upcoming" }).limit(5).toArray();

        const today = new Date().toISOString().split('T')[0];
        let context = `You are EventFlow Assistant, a helpful chatbot for college event management.\n\n`;
        context += `Current Date: ${today}\n\n`;
        context += `Upcoming Events:\n`;

        events.forEach(event => {
            context += `- ${event.title} on ${event.date} at ${event.time}, Venue: ${event.venue}, Category: ${event.category}\n`;
        });

        context += `\nAnswer questions about events, registration, feedback, and general queries.`;

        const sessionId = session_id || uuidv4();

        // Mocking LLM response as LlmChat is not available in standard Node.js libraries
        // In a real scenario, you would use OpenAI or another LLM API here.
        const responseText = `Hello! I am your EventFlow Assistant. I can see there are ${events.length} upcoming events. How can I help you today? (Note: LLM Integration requires an API key and library setup).`;

        res.json({
            response: responseText,
            session_id: sessionId
        });
    } catch (err) {
        console.error('Chat error:', err);
        res.status(500).json({ detail: `Chat error: ${err.message}` });
    }
});

// ============= STATS ROUTES =============

app.get('/api/stats/coordinator', authenticateToken, async (req, res) => {
    try {
        if (!["coordinator", "admin"].includes(req.user.role)) {
            return res.status(403).json({ detail: "Unauthorized" });
        }

        const query = req.user.role === "admin" ? {} : { coordinator_id: req.user.user_id };
        const events = await db.collection('events').find(query).toArray();

        let totalRegistrations = 0;
        let totalAttendance = 0;

        const processedEvents = await Promise.all(events.map(async (event) => {
            const regs = await db.collection('registrations').find({ event_id: event.id }).toArray();
            totalRegistrations += regs.length;
            totalAttendance += regs.filter(r => r.attendance_status === "attended").length;
            const { _id, ...eventData } = event;
            return eventData;
        }));

        res.json({
            total_events: events.length,
            total_registrations: totalRegistrations,
            total_attendance: totalAttendance,
            events: processedEvents
        });
    } catch (err) {
        res.status(500).json({ detail: err.message });
    }
});

// ============= SERVER START =============

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
    await client.close();
    process.exit(0);
});
