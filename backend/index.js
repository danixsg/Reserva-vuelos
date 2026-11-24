const express = require('express');
const cors = require('cors'); 
const app = express();

// Habilitar CORS (permite peticiones desde el frontend)
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'https://reserva-vuelos-1l5d.onrender.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rutas
app.use('/', require('./routes'));


// Servidor
app.listen(3000, () => console.log('`Server running on port 3000`'));
