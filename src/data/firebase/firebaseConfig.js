// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app")
const { getStorage } = require("firebase/storage")

const { envs } = require('../../config/plugins')

const firebaseConfig = {
    apiKey: envs.FIREBASE_API_KEY,
    authDomain: envs.FIREBASE_AUTH_DOMAIN,
    projectId: envs.FIREBASE_PROJECT_ID,
    storageBucket: envs.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: envs.FIREBASE_MESSAGING_SENDER_ID,
    appId: envs.FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp)

console.log(`Firebase Storage connected to "${firebaseApp.options.authDomain}"`)

module.exports = { firebaseApp, storage }
