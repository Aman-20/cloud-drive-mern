const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoConnect = require("../backend/config/connection");
const path = require("path");

const errorHandler = require("../backend/middleware/errorhandler");

const staticRoute = require("../backend/router/staticRoute");
const userRoute = require("../backend/router/userRoute");
const fileRouter = require("../backend/router/fileRouter");

const helmet = require("helmet");

const PORT = process.env.PORT || 3000;
const app = express();

app.use(helmet());
app.set("trust proxy", 1);

//middleware
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials:true,
    origin:process.env.FRONTEND_URL,
}));

app.use(express.static(path.join(__dirname,"public")))

mongoConnect(process.env.MONGO_URL);

app.use("/", staticRoute);
app.use("/user", userRoute);
app.use('/file', fileRouter);

// 404 for unknown routes (otherwise Express sends HTML "Cannot GET /xyz")
app.use((req, res) => {
    res.status(404).json({ success: false, msg: "Route not found" });
});

// Global error handler
app.use(errorHandler);


app.listen(PORT, ()=>{
    console.log(`Express Connected to Port ${PORT}`);
});