const app = require("./app");
require("dotenv").config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`🚀 Serveur EcoRide lancé sur http://localhost:${PORT}`);
});
