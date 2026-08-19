# ✈️ Reserva de Vuelos

<p align="center">
  Sistema web para la gestión y reserva de vuelos desarrollado como proyecto universitario.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white">
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">
</p>

---

## 📖 Sobre el proyecto

AereoSky es una aplicación web integral que simula una plataforma de reservas aéreas, integrando todas las funcionalidades que un aeropuerto o agencia digital moderna necesita para su operación. 

La plataforma ofrece una experiencia completa para el **Cliente**, quien puede navegar libremente por las pestañas de *Explorar*, buscar disponibilidad en *Vuelos*, gestionar su itinerario en *Mis Reservas* y comunicarse a través de *Contacto*. Los usuarios pueden seleccionar sus destinos, agendar vuelos y finalizar su compra mediante un proceso de pago con tarjeta interactivo y simulado. Todo esto está respaldado por un sistema de autenticación seguro que permite el registro, inicio de sesión, recuperación y cambio de contraseña, incluyendo el envío de notificaciones al correo electrónico para confirmar reservas y recuperar claves (lo cual requiere configurar manualmente las credenciales del correo emisor).

A nivel de gestión, el sistema implementa un estricto control de acceso por roles donde el **Administrador** tiene acceso a un panel exclusivo equipado con operaciones CRUD completas. Desde allí, se administra de forma centralizada todo el ecosistema del aeropuerto: gestión de Aviones, Fabricantes, Aerolíneas, control de Usuarios y la administración total de las Reservas.

---

## ✏️ Funcionalidades

### 👤 Usuario

- Registro e inicio de sesión
- Recuperación y cambio de contraseña
- Búsqueda y consulta de vuelos
- Visualización de detalles de vuelos
- Reserva de vuelos
- Simulación de pago mediante tarjeta
- Consulta y gestión de reservas
- Gestión de cuenta

### 🛡️ Administrador

Panel administrativo para gestionar:

- Usuarios
- Vuelos
- Aerolíneas
- Aviones
- Fabricantes
- Reservas

Las entidades correspondientes cuentan con operaciones **CRUD**.

---

## 🏗️ Arquitectura

El proyecto está dividido en dos componentes principales:

**Frontend**

Interfaz web desarrollada con **HTML5, JavaScript, Tailwind CSS y Vite**, encargada de la interacción con el usuario, navegación, formularios, consultas y gestión de las diferentes funcionalidades del sistema.

**Backend**

API desarrollada con **Node.js y Express.js**, encargada de procesar las solicitudes, aplicar la lógica del sistema, gestionar la autenticación y comunicarse con la base de datos.

**Base de datos**

Se utiliza **PostgreSQL** para almacenar y relacionar la información de usuarios, vuelos, aerolíneas, aviones, fabricantes y reservas.

## 🛠️ Instalación
**1. Clonar el repositorio**
```bash
git clone https://github.com/danixsg/Reserva-vuelos.git
cd Reserva-vuelos
```
**2. Instalar dependencias**
 
Backend
```bash
cd backend
npm install
```
Frontend
```bash
cd ../frontend
npm install
```
**3. Configurar el entorno**

Crear el archivo .env dentro de backend/ con las variables necesarias para la conexión a la base de datos y la autenticación.

**4. Ejecutar**

Iniciar el Backend y Frontend utilizando los comandos definidos en sus respectivos package.json.```

## ⚠️ Aviso

> 📚 **Proyecto académico**
>
> Esta aplicación fue desarrollada exclusivamente con fines educativos y demostrativos.
>
> Todos los vuelos, precios, usuarios y demás datos utilizados son **ficticios**.
>
> El pago mediante tarjeta es únicamente una **simulación** y no realiza transacciones reales.

---

🎓 Proyecto — Sistema de Reserva de Vuelos
