const express = require('express');
const app = express();
const port = 3000;

// Firebase admin SDK to access Firestore from the server
const admin = require('firebase-admin');

// Listen for termination signals
process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down server...');
    // Close the server gracefully
    server.close(() => {
        console.log('Server has been shutdown.');
        process.exit(0);
    });
});

// Initialize Firebase Admin SDK with service account
var serviceAccount = require("./hackathon-d9723-firebase-adminsdk-vl1a6-5a17b5f0bb.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();

// TO redirect node to the given file location
app.use(express.static(__dirname));


app.get('/form/:id', async (req, res) => {
    // Fetch the form data from Firestore using the ID from req.params.id
    let docRef = db.collection('forms').doc(req.params.id);
    let doc = await docRef.get();
    if (!doc.exists) {
        console.log('No such document!');
        res.status(404).send('Not found');
    } else {
        let data = doc.data();
        console.log('Form Data:', data); // Log the form data to the console
        let question = data.question;
        let options = data.options;

        // Generate the HTML content using the form data
        // Inside the template string for your HTML content
        let htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Poll ${req.params.id}</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #121212; /* Dark mode background color */
                    color: #ffffff; /* Dark mode text color */
                    margin: 0;
                    padding: 0;
                }

                .header {
                    text-align: center;
                    margin-bottom: 20px;
                    color: #61dafb; /* React color for a pop of color */
                }

                form {
                    max-width: 600px;
                    margin: 0 auto;
                }

                h2 {
                    color: #61dafb;
                }

                .option {
                    background-color: #333;
                    margin: 10px 0;
                    padding: 10px;
                    border-radius: 5px;
                }

                label {
                    color: #ffffff;
                }

                input[type="submit"] {
                    background-color: #61dafb;
                    color: #121212;
                    padding: 10px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }

                /* Chart container styles */
                .chart-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 40vh;
                    width: 80vw;
                    margin: 20px auto;
                }
            </style>

            <!-- Add this script tag to include Chart.js -->
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        </head>
        <body>
            <div class="header">
                <h1>PollSay</h1>
            </div>
            <form action="/submit/${req.params.id}" method="post">
                <h2>${question}</h2>
                ${options.map((option, index) => `
                    <div class="option">
                        <input type="radio" id="option${index}" name="option" value="${option}">
                        <label for="option${index}">${option}</label>
                    </div>
                `).join('')}
                <input type="submit" value="Submit">
            </form>

            <!-- Add a canvas element for the chart -->
            <div class="chart-container">
                <canvas id="pollChart"></canvas>
            </div>

            <script>
                // Extract responses data from Firestore
                const responses = ${JSON.stringify(data.responses || {})};

                // Get the chart canvas
                const canvas = document.getElementById('pollChart').getContext('2d');

                // Create an array of labels and data for Chart.js
                const labels = Object.keys(responses);
                const data = Object.values(responses);

                // Generate dynamic colors based on the number of responses
                const dynamicColors = (numColors) => {
                    const colors = [];
                    for (let i = 0; i < numColors; i++) {
                        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
                        colors.push(randomColor);
                    }
                    return colors;
                };

                // Create a pie chart
                new Chart(canvas, {
                    type: 'pie',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: dynamicColors(labels.length),
                        }]
                    }
                });
            </script>
        </body>
        </html>
        `;

        res.send(htmlContent);
    }
});

app.post('/submit/:id', express.urlencoded({ extended: true }), async (req, res) => {
    let formId = req.params.id;
    let selectedOption = req.body.option;
    let userEmail = req.body.userEmail; // Get the user's email from the request body

    // Save the selected option to Firestore
    let docRef = db.collection('forms').doc(formId);
    let doc = await docRef.get();
    if (!doc.exists) {
        console.log('No such document!');
        res.status(404).send('Not found');
    } else {
        let data = doc.data();
        if (!data.responses) {
            data.responses = {};
        }
        if (!data.responses[selectedOption]) {
            data.responses[selectedOption] = 0;
        }

        // Check if the unique user constraint is enabled
        if (data.constraints && data.constraints.requireUniqueID) {
            // If the unique user constraint is enabled, check if the user has already voted
            if (data.voters && data.voters.includes(userEmail)) {
                // If the user has already voted, send an error response
                res.status(400).send('You have already voted.');
                return;
            } else {
                // If the user hasn't voted yet, add their email to the voters list
                if (!data.voters) {
                    data.voters = [];
                }
                data.voters.push(userEmail);
            }
        }

        // Increment the count for the selected option
        data.responses[selectedOption]++;

        // Save the updated form data to Firestore
        await docRef.set(data, { merge: true });

        // Send a success response
        res.send('Thank you for your submission!');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});



// form => code B9Fyv0fAJg