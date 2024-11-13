const express = require('express')
const multer = require('multer')
const router = express.Router()

const { upload } = require('../../middlewares/multer')
const verifyToken = require('../../middlewares/jwt')

const {
    getAllProducts,
    getProductById,
    getLastProductCreated,
    createProduct,
    editProduct,
    deleteProduct,
    deleteProductImage
} = require('../../controllers/products/productsController')

router.get('/', verifyToken, getAllProducts)

router.get('/detail/:id', verifyToken, getProductById)

router.get('/lastProduct', verifyToken, getLastProductCreated)

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

            createProduct(req, res);
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

            editProduct(req, res);
        });
    }
)

router.delete('/deleteProductImage', verifyToken, deleteProductImage)

router.delete("/delete/:id", verifyToken, deleteProduct);

module.exports = router