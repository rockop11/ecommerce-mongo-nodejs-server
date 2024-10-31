const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require("../../data/mongodb/models/userModel")
const { envs } = require('../../config/plugins')
const { storage } = require('../../data/firebase/firebaseConfig');
const { ref, uploadBytes, getDownloadURL, deleteObject } = require("firebase/storage");
const { trusted } = require('mongoose');


const authApiControllers = {
    login: async (req, res) => {
        try {
            const { username, email, password, } = req.body;

            if ((!username || !email) && !password) {
                return res.status(400).json({
                    message: 'Faltan credenciales',
                    data: null
                });
            }

            const userFounded = await userModel.findOne({
                $or: [
                    { email },
                    { username }
                ]
            })

            if (!userFounded) {
                return res.status(400).json({
                    message: 'Credenciales inválidas',
                    data: null
                });
            }

            const checkPass = bcrypt.compareSync(password, userFounded.password);

            if (!checkPass) {
                return res.status(400).json({
                    message: 'Credenciales inválidas',
                    data: null
                });
            }

            //imagen de Firebase Storage
            const userImageRef = ref(storage, `users-avatars/${userFounded.email}/${userFounded.image}`)
            const userImage = await getDownloadURL(userImageRef)

            const { password: _, ...rest } = userFounded.toObject();

            const userData = { ...rest, userImage }

            const token = jwt.sign({ userData }, envs.JWT_SECRET_KEY, { expiresIn: '1h' });

            res.status(200).json({
                message: 'Login Successfully',
                data: token
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error interno del servidor',
                data: null
            });
        }
    },

    register: async (req, res) => {
        //validar que el email y/o usuario no esten en uso.
        try {
            const { name, username, password, email } = req.body
            const { file } = req

            if (!name || !username || !password || !email || file === undefined) {
                return res.status(400).json({
                    message: "Debe completar los campos"
                })
            }

            const userRegistered = await userModel.findOne({
                $or: [
                    { email },
                    { username }
                ]
            })

            if (userRegistered) {
                return res.status(400).json({
                    message: "usuario o email en uso"
                })
            }

            const storageRef = ref(storage, `users-avatars/${email}/${file.originalname}`)

            const metadata = {
                contentType: file.mimetype,
            };

            await uploadBytes(storageRef, file.buffer, metadata)

            await userModel.create({
                name: name,
                username: username,
                password: bcrypt.hashSync(password, 10),
                image: file.originalname,
                email: email,
                isAdmin: false
            })

            res.json({
                status: 200,
                message: 'usuario creado',
            })

        } catch (error) {
            res.json({
                status: 400,
                error: error.message
            })
        }
    },

    editUser: async (req, res) => {
        try {
            const { _id, name, username, email } = req.body
            const { file } = req

            let image;

            const userFounded = await userModel.findById(_id)

            //si llega la imagen...
            if (file !== undefined) {
                image = file.originalname

                //borramos la imagen previa que estan en firebase storage
                const userImageRef = ref(storage, `/users-avatars/${userFounded.email}/${userFounded.image}`)
                await deleteObject(userImageRef)

                //subimos la imagen que llega desde el front.
                const storageRef = ref(storage, `users-avatars/${email}/${file.originalname}`)

                const metadata = {
                    contentType: file.mimetype,
                };

                await uploadBytes(storageRef, file.buffer, metadata)
            } else {
                image = userFounded.image
            }

            const filter = { _id }
            const update = { name, username, email, image }

            const userToEdit = await userModel.findOneAndUpdate(filter, update, {
                new: true
            })

            const { password: _, _id: __, ...rest } = userToEdit.toObject();

            return res.status(200).json({
                message: 'Usuario Editado',
                data: rest
            })
        } catch (err) {
            res.json({
                status: 400,
                error: err.message
            })
        }
    },

    changePassword: async (req, res) => {
        try {
            const { _id, password } = req.body

            await userModel.findByIdAndUpdate(_id, {
                password: bcrypt.hashSync(password, 10)
            })

            res.status(200).json({
                message: 'se actualizo la contraseña'
            })

        } catch (error) {
            res.status(400).json({
                error: "internal server error"
            })
        }
    },

    checkToken: (req, res) => {
        res.status(200).json({ message: 'Token Valido' });
    },

    getAllUsers: async (req, res) => {
        try {
            const users = await userModel.find()

            const userWithoutProps = await Promise.all(users.map(async (user) => {
                const { password: _, ...userWithoutProps } = user.toObject()

                const imagesRef = ref(storage, `users-avatars/${user.email}/${user.image}`)
                const userImage = await getDownloadURL(imagesRef)

                return { ...userWithoutProps, image: userImage }
            }))

            res.status(200).json({
                length: users.length,
                users: userWithoutProps
            })
        } catch (err) {
            console.log(err)
        }
    },

    changeUserRole: async (req, res) => {
        try {
            const { _id, isAdmin } = req.body

            const filter = { _id }
            const update = { isAdmin: isAdmin }

            const updatedUser = await userModel.findOneAndUpdate(filter, update, {
                new: true
            })

            const { password: _, ...rest } = updatedUser.toObject()

            res.status(200).json({
                message: 'Se modifico el rol del usuario',
                data: rest
            })

        } catch (err) {
            res.status(500).json({ message: 'Error al actualizar el rol de usuario', err });
        }
    },

    deleteUser: async (req, res) => {
        //borrar usuarios
    }
}

module.exports = authApiControllers