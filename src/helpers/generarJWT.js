import jwt from 'jsonwebtoken';

const generarJWT = (id)=>{
    return jwt.sign({id}, process.env.JWT_SECRET, 
    {
        expiresIn: '1d',
        algorithm: 'HS256',   
})
}
export default generarJWT;