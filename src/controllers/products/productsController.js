const Products = require("../../data/mongodb/models/productModel")
const { storage } = require('../../data/firebase/firebaseConfig')
const { ref, uploadBytes, deleteObject, listAll, getDownloadURL } = require("firebase/storage")

const productsController = {
    getAllProducts: async (req, res) => {

        const productList = await Products.find()

        const productsWithImages = await Promise.all(productList.map(async (product) => {
            const imagesRef = ref(storage, `products/${product.title}`)

            const images = await listAll(imagesRef)

            const firstProductImage = images.items.length > 0
                ? await getDownloadURL(images.items[0])
                : null

            return { ...product._doc, imageUrl: firstProductImage }
        }))

        res.status(200).json({
            length: productList.length,
            data: productsWithImages
        })
    },

    getProductById: async (req, res) => {
        try {
            const { id } = req.params

            const product = await Products.findById(id)

            const listRef = ref(storage, `products/${product.title}`)

            const imagesList = await listAll(listRef)

            const imagesUrl = await Promise.all(
                imagesList.items.map(async (item) => {
                    const url = await getDownloadURL(item);
                    return url;
                })
            )

            res.status(200).json({
                data: product,
                urlImages: imagesUrl
            })

        } catch (error) {
            res.status(404).json({
                message: "No se encontro el producto"
            })
        }
    },

    getLastProductCreated: async (req, res) => {
        try {
            const productsList = await Products.find()
            const productsListLength = productsList.length

            const lastProduct = productsList[productsListLength - 1]

            const lastProductObject = lastProduct.toObject();

            const imageRef = ref(storage, `products/${lastProduct.title}/${lastProduct.images[0]}`)
            const image = await getDownloadURL(imageRef)

            const lastProductWithImage = { ...lastProductObject, imageUrl: image }

            res.status(200).json({
                message: 'Producto encontrado',
                data: lastProductWithImage,
            })
        } catch (err) {
            res.status(500).json({
                message: 'no se pudo obtener el ultimo producto creado'
            })
        }
    },

    createProduct: async (req, res) => {
        try {
            const { title, price, discount, stock, category, description, createdBy } = req.body
            const { files } = req

            if (!title || !price || !discount || !stock || !category || !createdBy || !description || !files.length) {
                return res.status(400).json({
                    message: "Debe completar todos los campos"
                })
            }

            const uploadPromises = files.map((file) => {
                const storageRef = ref(storage, `products/${title}/${file.originalname}`);
                const metadata = {
                    contentType: file.mimetype
                };
                return uploadBytes(storageRef, file.buffer, metadata);
            });

            await Promise.all(uploadPromises);

            const newProduct = await Products.create({
                title,
                price,
                discount,
                stock,
                category,
                createdBy,
                description,
                date: new Date(),
                images: files.map(file => {
                    return file.originalname
                })
            })

            res.status(200).json({
                message: "Producto creado",
                data: newProduct
            })

        } catch (error) {
            return res.status(500).json({
                message: "internal server error",
                error: error.message
            })
        }
    },

    editProduct: async (req, res) => {
        try {
            const { id } = req.params
            const { title, price, discount, stock, category, description } = req.body
            const { files } = req

            const existingProduct = await Products.findById(id)

            if (!existingProduct) {
                return res.status(404).json({
                    message: 'Producto no encontrado'
                });
            }

            // existingProduct.title = title || existingProduct.title
            // existingProduct.price = price || existingProduct.price
            // existingProduct.discount = discount || existingProduct.discount
            // existingProduct.stock = stock || existingProduct.stock
            // existingProduct.category = category || existingProduct.category

            // if (files && files.length > 0) {
            //     const newImages = files.map(file => file.filename);
            //     existingProduct.images = [...existingProduct.images, ...newImages];
            // }


            // const updatedProduct = await existingProduct.save()


            res.status(200).json({
                message: `se encontro el producto con id: ${id} es ${existingProduct.title}`
            })

            // res.status(200).json({
            //     message: `se edito el producton con id ${id}`,
            //     data: updatedProduct
            // })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                message: 'internal server error'
            })
        }
    },

    deleteProductImage: async (req, res) => {
        try {
            const { prodId, folderName, fileName } = req.body

            const updatedProduct = await Products.findOneAndUpdate(
                { _id: prodId },
                { $pull: { images: fileName } },
                { new: true }
            )

            console.log(updatedProduct)

            const imageRef = ref(storage, `products/${folderName}/${fileName}`)
            await deleteObject(imageRef)

            res.status(200).json({
                message: 'se borro la imagen del producto'
            })
        } catch (err) {
            res.status(500).json({
                message: 'Hubo un error al eliminar la imagen del producto'
            })
        }
    },

    deleteProduct: async (req, res) => {
        try {
            const { id } = req.params;

            const productToDelete = await Products.findById(id);

            if (!productToDelete) {
                return res.status(404).json({ message: "Producto no encontrado" });
            }

            const deleteImagePromises = productToDelete.images.map(image => {
                const imageRef = ref(storage, `products/${productToDelete.title}/${image}`);
                return deleteObject(imageRef);
            });

            // Esperar a que todas las promesas de eliminación se resuelvan o fallen
            await Promise.all(deleteImagePromises);

            await Products.findByIdAndDelete(id);

            res.status(200).json({
                message: `Se eliminó: ${productToDelete.title} con id: ${productToDelete._id}`
            });
        } catch (err) {
            console.error("Error al eliminar producto o imágenes:", err);
            res.status(500).json({
                message: "Error interno del servidor"
            });
        }
    },
}

module.exports = productsController