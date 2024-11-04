const express = require('express')
const router = express.Router()

const jwtMiddleware = require('../../middlewares/jwt')
const { upload } = require('../../middlewares/multer')
const {
    changePassword,
    changeUserRole,
    checkToken,
    deleteUser,
    editUser,
    getAllUsers,
    getLastProductCreated,
    login,
    register,
} = require('../../controllers/auth/authControllers')

router.post('/login', login)
router.post('/register', upload.single('avatar'), register)

router.put('/editUser', jwtMiddleware, upload.single('avatar'), editUser)

router.patch('/changePassword', jwtMiddleware, changePassword)
router.patch('/changeUserRole', jwtMiddleware, changeUserRole)

router.delete('/deleteUser/:id', jwtMiddleware, deleteUser)

router.get('/checkToken', jwtMiddleware, checkToken)
router.get('/allUsers', jwtMiddleware, getAllUsers)
router.get('/lastUserCreated', jwtMiddleware, getLastProductCreated)

module.exports = router