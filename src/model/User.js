import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema({
    name: String,
    role: String,
    rut: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
})

UserSchema.pre("save", async function (next){
    if(!this.isModified("password")){
        next();
    }
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt);
})

UserSchema.methods.comprobarPassword = async function (passwordFormulario){
    const result = await bcrypt.compare(passwordFormulario, this.password)
    return result;
}

const User = mongoose.model('User', UserSchema, 'User');
export default User;