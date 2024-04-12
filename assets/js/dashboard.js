// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD1E7L8HTG4pz9YwU-uH0Ukc1OAMmSiBXA",
    authDomain: "pollsay.firebaseapp.com",
    projectId: "pollsay",
    storageBucket: "pollsay.appspot.com",
    messagingSenderId: "512729911469",
    appId: "1:512729911469:web:f7b74a38449401dd767624",
    measurementId: "G-X6DY3KMLWK"
  };

firebase.initializeApp(firebaseConfig);

// Reference to the forms collection in the database
const formsRef = firebase.database().ref('forms');

// Fetch forms created by the current user
formsRef.orderByChild('createdByEmail').equalTo(userEmail).on('value', (snapshot) => {
    const formsList = document.getElementById('formsList');
    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            const formKey = childSnapshot.key;
            const formData = childSnapshot.val();
            // Process the form data as needed
            console.log('Form Key:', formKey);
            console.log('Form Data:', formData);
        });
    } else {
        formsList.innerText = 'No forms yet';
    }
});    
    
    
    // Retrieve user's email from local storage
    const userEmail = localStorage.getItem("userEmail");

    // Display user's email on the dashboard
    document.getElementById("userEmail").innerText = "Email: " + userEmail;

    function createForm() {
        // Ask the user if they want to create a form
        if (confirm('Do you want to create a form?')) {
            // If they confirm, redirect to customize.html
            window.location.href = 'customize.html';
        }
    }


