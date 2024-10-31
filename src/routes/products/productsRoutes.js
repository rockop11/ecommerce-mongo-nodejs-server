const express = require('express')
const multer = require('multer')
const router = express.Router()

const { upload } = require('../../middlewares/multer')
const verifyToken = require('../../middlewares/jwt')

const productsController = require('../../controllers/products/productsController')

router.get('/', verifyToken, productsController.getAllProducts)

router.get('/detail/:id', verifyToken, productsController.getProductById)

router.get('/lastProduct', verifyToken, productsController.getLastProductCreated)

router.post('/create',
    verifyToken,
    (req, res) => {
        upload.array('images', 4)(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    message: "Puede subir hasta 4 imágenes"
                });
            } else if (err) {
                return res.status(500).json({
                    message: "Error al subir imágenes"
                });
            }

            productsController.createProduct(req, res);
        });
    }
);

router.patch('/edit/:id',
    verifyToken,
    (req, res) => {
        upload.array('images', 4)(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    message: "Puede subir hasta 4 imágenes"
                });
            } else if (err) {
                return res.status(500).json({
                    message: "Error al subir imágenes"
                });
            }

            productsController.editProduct(req, res);
        });
    }
)

router.delete("/delete/:id", verifyToken, productsController.deleteProduct);

module.exports = router