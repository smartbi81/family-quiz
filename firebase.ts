import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// This was automatically populated from the image you provided.
const firebaseConfig = {
  apiKey: "AIzaSyCElKK3B-YihPsiocReOxThyaXPyy7Nkrs",
  authDomain: "family-quiz-game.firebaseapp.com",
  databaseURL: "https://family-quiz-game-default-rtdb.firebaseio.com",
  projectId: "family-quiz-game",
  storageBucket: "family-quiz-game.firebasestorage.app",
  messagingSenderId: "999453139251",
  appId: "1:999453139251:web:84d7082c059aa88f749e46",
  measurementId: "G-V83HQ1V5BY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the database service
export const database = getDatabase(app);
