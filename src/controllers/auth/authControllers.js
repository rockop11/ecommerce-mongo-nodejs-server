const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require("../../data/mongodb/models/userModel")
const { envs } = require('../../config/plugins')
const { storage } = require('../../data/firebase/firebaseConfig');
const { ref, uploadBytes, getDownloadURL, deleteObject } = require("firebase/storage");


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

            const userFounded = await User.findOne({
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

            const userRegistered = await User.findOne({
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

            await User.create({
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

            const userFounded = await User.findById(_id)

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

            const userToEdit = await User.findOneAndUpdate(filter, update, {
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
            const { userId, currentPassword, newPassword } = req.body

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    message: 'debe completar los campos',
                })
            }

            const userFounded = await User.findById(userId)

            if (!userFounded) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            const { password } = userFounded
            const checkPass = bcrypt.compareSync(currentPassword, password);

            if (!checkPass) {
                return res.status(400).json({
                    message: 'Error al actualizar contraseña',
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            userFounded.password = hashedPassword;
            await userFounded.save();

            res.status(200).json({ message: 'Contraseña actualizada con éxito' });

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
            const users = await User.find()

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

    getLastUserCreated: async (req, res) => {
        try {
            const usersList = await User.find()
            const usersListLength = usersList.length

            const lastUser = usersList[usersListLength - 1]

            const lastUserObject = lastUser.toObject()

            const imageRef = ref(storage, `users-avatars/${lastUser.email}/${lastUser.image}`)
            const image = await getDownloadURL(imageRef)

            const lastUserCreated = { ...lastUserObject, image: image }

            const { password: _, ...rest } = lastUserCreated

            res.status(200).json({
                message: 'Ultimo usuario creado',
                data: rest
            })
        } catch (err) {
            res.status(500).json({
                message: 'no se pudo obtener el ultimo usuario creado'
            })
        }
    },

    changeUserRole: async (req, res) => {
        try {
            const { _id, isAdmin } = req.body

            const filter = { _id }
            const update = { isAdmin: isAdmin }

            const updatedUser = await User.findOneAndUpdate(filter, update, {
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
        const { id } = req.params

        try {
            const userToDelete = await User.findById(id)

            await User.findByIdAndDelete(id);

            const userImageRef = ref(storage, `/users-avatars/${userToDelete.email}/${userToDelete.image}`)
            await deleteObject(userImageRef)

            res.status(204).json({
                message: `se elimino el Usuario con id: ${id}`,
            })

        } catch (error) {
            res.status(500).json({
                message: 'Hubo un error en la solicitud'
            })
        }
    },

    recoveryLink: async (req, res) => {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({
                message: 'Por favor, proporciona un correo electrónico'
            });
        }

        try {
            const user = await User.findOne({ email })

            if (!user) {
                return res.status(404).json({
                    message: 'El correo electrónico no está registrado'
                });
            }

            const secret = envs.JWT_SECRET_KEY;
            const token = jwt.sign({ id: user._id }, secret, { expiresIn: '1h' });

            // const recoveryLink = `https://tuapp.com/auth/recovery-password/${token}`;
            const recoveryLink = `http://localhost:5173/recoveryPassword/${token}`

            const testAccount = await nodemailer.createTestAccount();

            const transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false, // True para el puerto 465, falso para otros puertos
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });

            const infoEmail = await transporter.sendMail({
                from: '"Soporte" <ecommerce@fake.com>',
                to: email,
                subject: 'Recuperación de contraseña',
                html: `
                  <p>Hola,</p>
                  <p>Haz clic en el siguiente enlace para recuperar tu contraseña:</p>
                  <a href="${recoveryLink}">${recoveryLink}</a>
                  <p>Este enlace expira en 1 hora.</p>
                `,
            });

            const previewUrl = nodemailer.getTestMessageUrl(infoEmail);

            res.status(200).json({
                message: 'Correo de recuperación enviado con éxito',
                previewUrl
            });
        } catch (error) {
            console.error('Error en solicitud de recuperación:', error);
            res.status(500).json({ message: 'Error enviando el correo de recuperación' });
        }
    },

    recoveryPassword: async (req, res) => {
        const { token } = req.params
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                message: 'La nueva contraseña debe tener al menos 6 caracteres.',
            });
        }

        try {
            const { id } = jwt.verify(token, envs.JWT_SECRET_KEY);
            const user = await User.findById(id);

            if (!user) {
                return res.status(404).json({
                    message: 'Usuario no encontrado o enlace inválido.',
                });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            user.password = hashedPassword;
            await user.save();

            res.status(200).json({
                message: 'Contraseña actualizada con éxito.',
            });
        } catch (error) {
            console.error('Error en la recuperación de contraseña:', error);

            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    message: 'El enlace de recuperación ha expirado.',
                });
            }

            res.status(500).json({
                message: 'Error procesando la recuperación de contraseña.',
            });
        }
    }
}

module.exports = authApiControllers