import mongoose from "mongoose";

const Clients = new mongoose.Schema({
    nameResponsible: "String",
    rutResponsible: "String",
    emailResponsible: "String",
    nameClient: "String",
    rutClient: "String",
    emailClient: "String",
    documents: {
        type: mongoose.Schema.Types.Mixed,
        default: []
    }
})

const Client = mongoose.model("Clients", Clients, "Clients");
export default Client;