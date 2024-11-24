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
    getLastUserCreated,
    login,
    register,
    recoveryLink,
    recoveryPassword
} = require('../../controllers/auth/authControllers')

router.post('/login', login)
router.post('/register', upload.single('avatar'), register)

router.post('/recoveryLink', recoveryLink)
router.post('/recoveryPassword/:token', recoveryPassword)

router.put('/editUser', jwtMiddleware, upload.single('avatar'), editUser)

router.patch('/changePassword', jwtMiddleware, changePassword)
router.patch('/changeUserRole', jwtMiddleware, changeUserRole)

router.delete('/deleteUser/:id', jwtMiddleware, deleteUser)

router.get('/checkToken', jwtMiddleware, checkToken)
router.get('/allUsers', jwtMiddleware, getAllUsers)
router.get('/lastUserCreated', jwtMiddleware, getLastUserCreated)

module.exports = router