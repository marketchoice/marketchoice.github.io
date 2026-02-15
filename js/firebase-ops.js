// firebase-ops.js

// Import Firebase SDK (make sure you include firebase-app.js and firebase-database.js in your HTML)

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDwAykagQZBJHSINCFFb6tkn3BzTTtR4f0",
  authDomain: "marketchoice-bad01.firebaseapp.com",
  databaseURL: "https://marketchoice-bad01-default-rtdb.firebaseio.com",
  projectId: "marketchoice-bad01",
  storageBucket: "marketchoice-bad01.firebasestorage.app",
  messagingSenderId: "60323903521",
  appId: "1:60323903521:web:3955b48f448f8beae74b60"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Function to read JSON data
function readData(path, callback) {
  database.ref(path).on("value", function (snapshot) {
    callback(snapshot.val());
  });
}

// Function to write JSON data
function writeData(path, data) {
  database.ref(path).set(data);
}

// Function to update JSON data
function updateData(path, data) {
  database.ref(path).update(data);
}

// Function to read JSON data once
function readDataOnce(path, callback) {
  database.ref(path).once("value").then(function (snapshot) {
    callback(snapshot.val());
  });
}

// Export functions (if using modules)
window.firebaseOps = {
  readData,
  readDataOnce,
  writeData,
  updateData
};
