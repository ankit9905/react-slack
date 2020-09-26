import firebase  from 'firebase/app';
import "firebase/auth" ;
import "firebase/database";
import "firebase/storage";

var firebaseConfig = {
    apiKey: "AIzaSyAULUVLn14ofDzI_M8J0MWgMsN3uf-6Tt0",
    authDomain: "react-slack-clone-7b99d.firebaseapp.com",
    databaseURL: "https://react-slack-clone-7b99d.firebaseio.com",
    projectId: "react-slack-clone-7b99d",
    storageBucket: "react-slack-clone-7b99d.appspot.com",
    messagingSenderId: "415161860510",
    appId: "1:415161860510:web:f37a2d392e362cd541568f",
    measurementId: "G-0WRZRKZBK8"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
//   firebase.analytics();

  export default firebase;