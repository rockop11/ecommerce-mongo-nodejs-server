const { connect, connection } = require('mongoose');
const admin = require('firebase-admin');
const ProductModel = require('../models/productModel');
const UserModel = require('../models/userModel');
const { envs } = require("../../../config/plugins");
const bcrypt = require('bcrypt');

const mongoUrl = `${envs.MONGO_URL}test-node-db?authSource=admin`;
const serviceAccount = require(envs.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: envs.FIREBASE_STORAGE_BUCKET
});

const bucket = admin.storage().bucket();

connect(mongoUrl)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error al conectar a MongoDB', err));

// Crear productos de ejemplo
const products = [
    {
        title: 'Tv Samsung 65"',
        price: 1319999,
        discount: 5,
        stock: 10,
        category: 'Electrodomestico',
        images: ['tv-samsung.jpg', 'tv-samsung-2.jpg'],
        createdBy: 'Administrador',
        description: 'La Samsung Smart TV de 65 pulgadas ofrece una experiencia visual impresionante con su resolución 4K UHD, brindando colores vibrantes y detalles nítidos. Equipada con tecnología HDR, mejora el contraste en escenas oscuras y brillantes para una imagen más realista. Su diseño ultradelgado se adapta perfectamente a cualquier espacio, y con su sistema operativo Tizen, puedes acceder a tus aplicaciones favoritas como Netflix, YouTube y Disney+ de forma rápida y sencilla. Además, cuenta con asistentes de voz integrados como Alexa y Google Assistant, permitiendo un control fácil e intuitivo.'
    },
    {
        title: 'Lampara de pie',
        price: 76999,
        discount: 2,
        stock: 8,
        category: 'Hogar',
        images: ['lampara-de-pie.jpg', 'lampara-de-pie-2.jpeg'],
        createdBy: 'Administrador',
        description: 'La lámpara de pie moderna es el complemento perfecto para cualquier espacio, ofreciendo una iluminación suave y acogedora. Con su diseño estilizado y minimalista, se adapta fácilmente a salas de estar, dormitorios u oficinas, aportando un toque elegante y contemporáneo. Su altura ajustable y cabeza giratoria permiten dirigir la luz donde más se necesite, ideal para leer o crear ambientes relajados. Compatible con bombillas LED de bajo consumo, combina funcionalidad y estilo para mejorar la estética de tu hogar sin perder eficiencia energética.'
    }
];

// Crear usuarios de ejemplo
const users = [
    {
        name: 'Administrador',
        username: 'admin',
        password: bcrypt.hashSync('admin123', 10),
        image: 'anonimous.png',
        email: 'admin@admin.com',
        isAdmin: true
    },
    {
        name: 'Usuario Regular 4',
        username: 'usuario',
        password: bcrypt.hashSync('user123', 10),
        image: 'user-image.jpg',
        email: 'user@user.com',
        isAdmin: false
    }
];

// Función para insertar datos
const seedDB = async () => {

    await ProductModel.deleteMany();
    await UserModel.deleteMany();

    const [files] = await bucket.getFiles()
    for (const file of files) {
        await file.delete();
        console.log(`Imagen eliminada: ${file.name}`);
    }

    const basePath = 'public/seed-images/';

    // Subida de imágenes de productos
    for (const product of products) {
        for (const image of product.images) {
            const filePath = `${basePath}${image}`;
            await bucket.upload(filePath, {
                destination: `products/${product.title}/` + image,
            });
        }
    }

    // Subida de imágenes de usuarios
    for (const user of users) {
        const userAvatarPath = `${basePath}${user.image}`;
        await bucket.upload(userAvatarPath, {
            destination: `users-avatars/${user.email}/` + user.image,
        });
    }

    await ProductModel.insertMany(products);
    await UserModel.insertMany(users);
};

// Ejecutar el seeder
seedDB().then(() => {
    connection.close();
    console.log('Base de datos poblada con éxito.');
});

