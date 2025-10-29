const express = require('express');
const cors = require('cors'); 
const app = express();

// 🧠 Habilitar CORS (permite peticiones desde tu frontend)
app.use(cors({
  origin: 'https://reserva-vuelos-1l5d.onrender.com', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rutas
app.use('/', require('./routes'));


// Servidor
app.listen(3000, () => console.log('Server up on https://reserva-vuelos-backend.onrender.com'));
