import {type Response} from 'express'

const response = (res : Response, success : boolean, message : string, payload : any, status : number)=>{

    if(success){
        return res.status(status).json({success : success , message : message , ...payload })
    }

    return res.status(status).json( {success : success , error : message , ...payload } )  

}

export default response