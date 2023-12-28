import mongoose from "mongoose";

const InmobiliariaUsers = new mongoose.Schema({
    name: String,
    inmobiliariaName: String,
    role: {
        type: Number
    }
})

const InmobiliariaUser = mongoose.model("InmobiliariaUsers", InmobiliariaUsers, "InmobiliariaUsers");
export default InmobiliariaUser;