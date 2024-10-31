const express = require('express')
const router = express.Router()

const jwtMiddleware = require('../../middlewares/jwt')
const { upload } = require('../../middlewares/multer')
const {
    login,
    register,
    editUser,
    changePassword,
    checkToken,
    getAllUsers,
    changeUserRole
} = require('../../controllers/auth/authControllers')

router.post('/login', login)
router.post('/register', upload.single('avatar'), register)
router.put('/editUser', jwtMiddleware, upload.single('avatar'), editUser)
router.patch('/changePassword', jwtMiddleware, changePassword)
router.patch('/changeUserRole', jwtMiddleware, changeUserRole)

router.get('/checkToken', jwtMiddleware, checkToken)
router.get('/allUsers', jwtMiddleware, getAllUsers)

module.exports = router