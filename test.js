const express = require('express');
const app = express();
const PORT = 5000;

// A simple test route
app.get('/', (req, res) => {
    res.send('Hello from the Express server!');
});

app.listen(PORT, () => {
    console.log(`Test server is running on port ${PORT}`);
});